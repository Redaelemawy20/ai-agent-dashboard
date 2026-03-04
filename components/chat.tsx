"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { useToolStore } from "@/lib/tool-store";
import {
  loadMessages,
  saveMessages,
  useSessionStore,
} from "@/lib/session-store";
import { PreviewMessage } from "@/components/message";
import { Input } from "@/components/input";
import { ProjectInfo } from "@/components/project-info";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { ABORTED, pruneMessagesForStorage } from "@/lib/utils";

export interface ChatContentProps {
  sessionId: string | null;
  sandboxId: string | null;
  isInitializing: boolean;
}

export function Chat({
  sessionId,
  sandboxId,
  isInitializing,
}: ChatContentProps) {
  const [containerRef, endRef] = useScrollToBottom();
  const sessions = useSessionStore((s) => s.sessions);
  const updateSessionTitle = useSessionStore((s) => s.updateSessionTitle);
  const setActiveSessionHasMessages = useSessionStore(
    (s) => s.setActiveSessionHasMessages
  );

  const initialMessages = useMemo(
    () => (sessionId ? (loadMessages(sessionId) as UIMessage[]) : []),
    [sessionId]
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: sessionId ?? undefined,
    initialMessages,
    body: { sandboxId },
    maxSteps: 30,
    onError: (error) => {
      console.error("[Chat] useChat onError:", error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  const stop = useCallback(() => {
    stopGeneration();
    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  }, [stopGeneration, messages, setMessages]);

  const isLoading = status !== "ready";
  const syncFromMessages = useToolStore((s) => s.syncFromMessages);
  const setAgentStatus = useToolStore((s) => s.setAgentStatus);

  useEffect(() => syncFromMessages(messages), [messages, syncFromMessages]);

  useEffect(() => {
    if (status === "streaming") setAgentStatus("executing");
    else if (status === "submitted") setAgentStatus("thinking");
    else setAgentStatus("idle");
  }, [status, setAgentStatus]);

  // Persist messages to localStorage (screenshots pruned to save space)
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveMessages(sessionId, pruneMessagesForStorage(messages));
    }
  }, [sessionId, messages]);

  // Sync hasMessages for sidebar (disable "New chat" when current is empty)
  useEffect(() => {
    setActiveSessionHasMessages(messages.length > 0);
    return () => setActiveSessionHasMessages(false);
  }, [messages.length, setActiveSessionHasMessages]);

  // Update session title from first user message (only when still "New chat")
  useEffect(() => {
    if (!sessionId) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (session?.title !== "New chat") return;
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return;
    const text =
      firstUser.parts?.find((p): p is { type: "text"; text: string } =>
        p.type === "text"
      )?.text ?? "";
    const title = text.slice(0, 40).trim() || "New chat";
    updateSessionTitle(
      sessionId,
      text.length > 40 ? `${title}…` : title
    );
  }, [sessionId, sessions, messages, updateSessionTitle]);

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      console.log(
        "[ChatContent] User submitting message, input:",
        input?.slice(0, 80) + (input && input.length > 80 ? "..." : "")
      );
      handleSubmit(e);
    },
    [handleSubmit, input]
  );

  return (
    <>
      <div
        className="flex-1 space-y-6 py-4 overflow-y-auto px-4 min-h-0"
        ref={containerRef}
      >
        {messages.length === 0 ? <ProjectInfo /> : null}
        {messages.map((message, i) => (
          <PreviewMessage
            message={message}
            key={message.id}
            isLoading={isLoading}
            status={status}
            isLatestMessage={i === messages.length - 1}
          />
        ))}
        <div ref={endRef} className="pb-2" />
      </div>

      {messages.length === 0 && (
        <PromptSuggestions
          disabled={isInitializing}
          submitPrompt={(prompt) => append({ role: "user", content: prompt })}
        />
      )}

      <div className="bg-white shrink-0">
        <form onSubmit={onSubmit} className="p-4">
          <Input
            handleInputChange={handleInputChange}
            input={input}
            isInitializing={isInitializing}
            isLoading={isLoading}
            status={status}
            stop={stop}
          />
        </form>
      </div>
    </>
  );
}
