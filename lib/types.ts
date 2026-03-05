import { ABORTED } from "@/lib/utils";

export type EventStatus = "pending" | "complete" | "error";
export type AgentStatus = "idle" | "thinking" | "executing";
export type ChatStatus = "error" | "submitted" | "streaming" | "ready";

/** Dynamic key-value args for tool invocations. */
export type ToolArgs = Record<string, unknown>;

/** Known shapes for tool invocation results (image, text, string, aborted, or error). */
export type ToolResult =
  | { type: "image"; data: string }
  | { type: "text"; text: string }
  | { error?: unknown }
  | string
  | typeof ABORTED;

interface BaseEvent {
  toolCallId: string;
  timestamp: number;
  status: EventStatus;
  duration: number | null;
  result?: ToolResult;
}

export interface ComputerEvent extends BaseEvent {
  toolName: "computer";
  action: string;
  args: ToolArgs;
}

export interface BashEvent extends BaseEvent {
  toolName: "bash";
  command: string;
  args: ToolArgs;
}

export interface UnknownToolEvent extends BaseEvent {
  toolName: string;
  args: ToolArgs;
}

export type ToolEvent = ComputerEvent | BashEvent | UnknownToolEvent;
export type ActionCounts = Record<string, number>;

export function isComputerEvent(event: ToolEvent): event is ComputerEvent {
  return event.toolName === "computer";
}

export function getActionKey(event: ToolEvent): string {
  if (event.toolName === "computer") return (event as ComputerEvent).action;
  if (event.toolName === "bash") return "bash";
  return event.toolName;
}
