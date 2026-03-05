import type { UIMessage } from "ai";

const MESSAGES_KEY_PREFIX = "chat-messages-";

export function isUIMessageArray(value: unknown): value is UIMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (item == null || typeof item !== "object") return false;
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== "string" || obj.id === "") return false;
    if (obj.role !== "user" && obj.role !== "assistant" && obj.role !== "system")
      return false;
    if (obj.parts != null && !Array.isArray(obj.parts)) return false;
    return true;
  });
}

export function getMessagesKey(sessionId: string): string {
  return `${MESSAGES_KEY_PREFIX}${sessionId}`;
}

export function loadMessages(sessionId: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getMessagesKey(sessionId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return isUIMessageArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(sessionId: string, messages: UIMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getMessagesKey(sessionId),
      JSON.stringify(messages)
    );
  } catch (e) {
    console.error("Failed to save messages:", e);
  }
}

export function clearMessages(sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getMessagesKey(sessionId));
}
