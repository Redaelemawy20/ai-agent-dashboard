"use client";

import { useEffect } from "react";
import type { UIMessage } from "ai";
import { useToolStore } from "@/lib/stores/tool-store";
import type { ChatStatus } from "@/lib/types";

export interface UseChatToolSyncParams {
  messages: UIMessage[];
  status: ChatStatus;
  sessionId: string | null;
}

export function useChatToolSync({
  messages,
  status,
  sessionId,
}: UseChatToolSyncParams): void {
  const syncFromMessages = useToolStore((s) => s.syncFromMessages);
  const setAgentStatus = useToolStore((s) => s.setAgentStatus);

  useEffect(() => {
    syncFromMessages(messages, sessionId);
  }, [messages, sessionId, syncFromMessages]);

  useEffect(() => {
    if (status === "streaming") setAgentStatus("executing");
    else if (status === "submitted") setAgentStatus("thinking");
    else setAgentStatus("idle");
  }, [status, setAgentStatus]);
}
