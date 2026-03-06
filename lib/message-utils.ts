import type { UIMessage } from "ai";
import type { TimingEntry } from "@/lib/stores/tool-helpers";

export const prunedMessages = (messages: UIMessage[]): UIMessage[] => {
  if (messages.at(-1)?.role === "assistant") {
    return messages;
  }

  return messages.map((message) => {
    // check if last message part is a tool invocation in a call state, then append a part with the tool result
    message.parts = (message.parts ?? []).map((part) => {
      if (part.type === "tool-invocation") {
        if (
          part.toolInvocation.toolName === "computer" &&
          part.toolInvocation.args.action === "screenshot"
        ) {
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              result: {
                type: "text",
                text: "Image redacted to save input tokens",
              },
            },
          };
        }
        return part;
      }
      return part;
    });
    return message;
  });
};

const STORAGE_IMAGE_PLACEHOLDER = "[Screenshot redacted to save space]";

const TITLE_MAX_LENGTH = 40;

export function extractTitleFromFirstUserMessage(
  messages: UIMessage[]
): string | null {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return null;
  const text =
    firstUser.parts?.find(
      (p): p is { type: "text"; text: string } => p.type === "text"
    )?.text ?? "";
  const title = text.slice(0, TITLE_MAX_LENGTH).trim() || "New chat";
  return text.length > TITLE_MAX_LENGTH ? `${title}…` : title;
}

export function pruneMessagesForStorage(
  messages: UIMessage[],
  timings?: Record<string, TimingEntry>,
): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts?.map((part) => {
      if (part.type !== "tool-invocation") return part;
      const inv = part.toolInvocation;
      const result = "result" in inv ? inv.result : undefined;
      const timing = timings?.[inv.toolCallId];
      const enrichedInv = timing ? { ...inv, _timing: timing } : inv;

      if (
        inv.toolName === "computer" &&
        (inv.args as { action?: string }).action === "screenshot" &&
        result != null &&
        typeof result === "object" &&
        "type" in result &&
        (result as { type: string }).type === "image"
      ) {
        return {
          ...part,
          toolInvocation: {
            ...enrichedInv,
            result: {
              type: "text" as const,
              text: STORAGE_IMAGE_PLACEHOLDER,
            },
          },
        };
      }
      return timing ? { ...part, toolInvocation: enrichedInv } : part;
    }),
  }));
}
