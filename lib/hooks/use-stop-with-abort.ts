"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Message, UIMessage } from "ai";
import { ABORTED } from "@/lib/utils";

export interface UseStopWithAbortParams {
  stopGeneration: () => void;
  messages: UIMessage[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export function useStopWithAbort({
  stopGeneration,
  messages,
  setMessages,
}: UseStopWithAbortParams): () => void {
  return useCallback(() => {
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
}
