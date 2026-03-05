export type ChatStatus = "error" | "submitted" | "streaming" | "ready";

export interface ToolInvocationPart {
  toolInvocation: {
    toolCallId: string;
    state: string;
    args: Record<string, unknown>;
    result?: unknown;
  };
}

export interface ToolPartProps {
  part: ToolInvocationPart;
  isLatestMessage: boolean;
  status: ChatStatus;
}
