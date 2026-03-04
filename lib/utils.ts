import { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ABORTED = "User aborted";

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export const prunedMessages = (messages: UIMessage[]): UIMessage[] => {
  if (messages.at(-1)?.role === "assistant") {
    return messages;
  }

  return messages.map((message) => {
    // check if last message part is a tool invocation in a call state, then append a part with the tool result
    message.parts = message.parts.map((part) => {
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
}

const STORAGE_IMAGE_PLACEHOLDER = "[Screenshot redacted to save space]";

export function pruneMessagesForStorage(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts?.map((part) => {
      if (part.type !== "tool-invocation") return part;
      const inv = part.toolInvocation;
      const result = "result" in inv ? inv.result : undefined;
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
            ...inv,
            result: {
              type: "text" as const,
              text: STORAGE_IMAGE_PLACEHOLDER,
            },
          },
        };
      }
      return part;
    }),
  }));
}
