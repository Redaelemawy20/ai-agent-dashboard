"use client";

import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { loadMessages } from "@/lib/session-store";
import { PreviewMessage } from "@/components/message";
import { Input } from "@/components/input";
import { ProjectInfo } from "@/components/project-info";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useStopWithAbort } from "@/lib/hooks/use-stop-with-abort";
import { useChatSessionSync } from "@/lib/hooks/use-chat-session-sync";
import { useChatToolSync } from "@/lib/hooks/use-chat-tool-sync";

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

  // Stop generation and mark last tool invocation as aborted
  const stop = useStopWithAbort({
    stopGeneration,
    messages,
    setMessages,
  });

  // Persist messages, sync hasMessages, update session title from first user message
  useChatSessionSync({ sessionId, messages });

  // Sync tool events and agent status to tool store
  useChatToolSync({ messages, status });

  const isLoading = status !== "ready";

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
        <form onSubmit={handleSubmit} className="p-4">
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
