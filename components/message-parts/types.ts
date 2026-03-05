import type { ToolResult, ToolArgs, ChatStatus } from "@/lib/types";

export interface ToolInvocationPart {
  toolInvocation: {
    toolCallId: string;
    state: string;
    args: ToolArgs;
    result?: ToolResult;
  };
}

export interface ToolPartProps {
  part: ToolInvocationPart;
  isLatestMessage: boolean;
  status: ChatStatus;
}
