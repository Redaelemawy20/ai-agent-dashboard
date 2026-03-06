"use client";

import { useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { loadMessages } from "@/lib/stores/session-helpers";
import { PreviewMessage } from "@/components/message";
import { ChatInput } from "@/components/chat-input";
import { ProjectInfo } from "@/components/project-info";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";
import { useStopWithAbort } from "@/lib/hooks/use-stop-with-abort";
import { useChatSessionSync } from "@/lib/hooks/use-chat-session-sync";
import { useChatToolSync } from "@/lib/hooks/use-chat-tool-sync";
import { getChatErrorMessage } from "@/lib/utils";

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

  const initialMessages = useMemo(
    () => (sessionId ? loadMessages(sessionId) : []),
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
      const { title, description } = getChatErrorMessage(error);
      toast.error(title, {
        description,
        richColors: true,
        position: "top-center",
      });
    },
  });

  // Stop generation and mark last tool invocation as aborted
  const stop = useStopWithAbort({
    stopGeneration,
    messages,
    setMessages,
  });

  // Persist messages, sync hasMessages, update session title from first user message
  useChatSessionSync({ sessionId, messages });

  // Sync tool events and agent status to tool store
  useChatToolSync({ messages, status, sessionId });

  const isLoading = status !== "ready";

  const submitPrompt = useCallback(
    (prompt: string) => append({ role: "user", content: prompt }),
    [append]
  );

  return (
    <>
      <div
        className="flex-1 space-y-6 py-4 overflow-y-auto px-4 min-h-0"
        ref={containerRef}
      >
        {messages.length === 0 ? (
          <>
            <ProjectInfo />
            <p className="px-4 text-center text-sm text-zinc-500">
              Send a message below to get started. Once you&apos;ve started a
              conversation, you can create new chats.
            </p>
          </>
        ) : null}
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
          submitPrompt={submitPrompt}
        />
      )}

      <div className="bg-white shrink-0">
        <form onSubmit={handleSubmit} className="p-4">
          <ChatInput
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
