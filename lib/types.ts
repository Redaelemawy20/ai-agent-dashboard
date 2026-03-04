export type EventStatus = "pending" | "complete" | "error";
export type AgentStatus = "idle" | "thinking" | "executing";

interface BaseEvent {
  toolCallId: string;
  timestamp: number;
  status: EventStatus;
  duration: number | null;
  result?: unknown;
}

export interface ComputerEvent extends BaseEvent {
  toolName: "computer";
  action: string;
  args: Record<string, unknown>;
}

export interface BashEvent extends BaseEvent {
  toolName: "bash";
  command: string;
  args: Record<string, unknown>;
}

export interface UnknownToolEvent extends BaseEvent {
  toolName: string;
  args: Record<string, unknown>;
}

export type ToolEvent = ComputerEvent | BashEvent | UnknownToolEvent;
export type ActionCounts = Record<string, number>;

export function getActionKey(event: ToolEvent): string {
  if (event.toolName === "computer") return (event as ComputerEvent).action;
  if (event.toolName === "bash") return "bash";
  return event.toolName;
}
