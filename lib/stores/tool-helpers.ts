import type { Message } from "ai";
import type {
  ToolEvent,
  ToolResult,
  ToolArgs,
  EventStatus,
  ActionCounts,
} from "@/lib/types";
import { getActionKey } from "@/lib/types";

export interface TimingEntry {
  firstSeen: number;
  completedAt: number | null;
}

function deriveStatus(
  sdkState: string,
  result: ToolResult | undefined
): EventStatus {
  if (sdkState === "result") {
    if (
      result != null &&
      typeof result === "object" &&
      "error" in (result as Record<string, unknown>)
    ) {
      return "error";
    }
    if (result === "User aborted") return "error";
    return "complete";
  }
  return "pending";
}

export function syncToolEvents(
  messages: Message[],
  timings: Map<string, TimingEntry>,
): ToolEvent[] {
  const now = Date.now();
  const events: ToolEvent[] = [];

  for (const message of messages) {
    if (!message.parts) continue;
    for (const part of message.parts) {
      if (part.type !== "tool-invocation") continue;
      const inv = part.toolInvocation;

      let timing = timings.get(inv.toolCallId);
      if (!timing) {
        timing = { firstSeen: now, completedAt: null };
        timings.set(inv.toolCallId, timing);
      }

      const hasResult = "result" in inv;
      if (hasResult && !timing.completedAt) {
        timing.completedAt = now;
      }

      const status = deriveStatus(
        inv.state,
        hasResult ? inv.result : undefined,
      );
      const duration = timing.completedAt
        ? timing.completedAt - timing.firstSeen
        : null;

      const base = {
        toolCallId: inv.toolCallId,
        timestamp: timing.firstSeen,
        status,
        duration,
        result: hasResult ? inv.result : undefined,
      };

      const args = inv.args as ToolArgs;

      if (inv.toolName === "computer") {
        events.push({
          ...base,
          toolName: "computer",
          action: (args.action as string) ?? "unknown",
          args,
        });
      } else if (inv.toolName === "bash") {
        events.push({
          ...base,
          toolName: "bash",
          command: (args.command as string) ?? "",
          args,
        });
      } else {
        events.push({ ...base, toolName: inv.toolName, args });
      }
    }
  }

  return events;
}

export function countByAction(events: ToolEvent[]): ActionCounts {
  const counts: ActionCounts = {};
  for (const e of events) {
    const key = getActionKey(e);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
