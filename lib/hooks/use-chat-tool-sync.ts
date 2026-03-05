"use client";

import { useEffect } from "react";
import type { UIMessage } from "ai";
import { useToolStore } from "@/lib/stores/tool-store";
import type { ChatStatus } from "@/lib/types";

export interface UseChatToolSyncParams {
  messages: UIMessage[];
  status: ChatStatus;
}

export function useChatToolSync({
  messages,
  status,
}: UseChatToolSyncParams): void {
  const syncFromMessages = useToolStore((s) => s.syncFromMessages);
  const setAgentStatus = useToolStore((s) => s.setAgentStatus);

  useEffect(() => {
    syncFromMessages(messages);
  }, [messages, syncFromMessages]);

  useEffect(() => {
    if (status === "streaming") setAgentStatus("executing");
    else if (status === "submitted") setAgentStatus("thinking");
    else setAgentStatus("idle");
  }, [status, setAgentStatus]);
}
