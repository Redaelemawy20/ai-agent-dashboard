"use client";

import { useEffect } from "react";
import type { UIMessage } from "ai";
import {
  saveMessages,
  useSessionStore,
} from "@/lib/session-store";
import {
  extractTitleFromFirstUserMessage,
  pruneMessagesForStorage,
} from "@/lib/utils";

export interface UseChatSessionSyncParams {
  sessionId: string | null;
  messages: UIMessage[];
}

export function useChatSessionSync({
  sessionId,
  messages,
}: UseChatSessionSyncParams): void {
  const sessions = useSessionStore((s) => s.sessions);
  const updateSessionTitle = useSessionStore((s) => s.updateSessionTitle);
  const setActiveSessionHasMessages = useSessionStore(
    (s) => s.setActiveSessionHasMessages
  );

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveMessages(sessionId, pruneMessagesForStorage(messages));
    }
  }, [sessionId, messages]);

  useEffect(() => {
    setActiveSessionHasMessages(messages.length > 0);
    return () => setActiveSessionHasMessages(false);
  }, [messages.length, setActiveSessionHasMessages]);

  useEffect(() => {
    if (!sessionId) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (session?.title !== "New chat") return;
    const title = extractTitleFromFirstUserMessage(messages);
    if (title) updateSessionTitle(sessionId, title);
  }, [sessionId, sessions, messages, updateSessionTitle]);
}
