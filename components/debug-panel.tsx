"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useToolStore } from "@/lib/stores/tool-store";
import type { ToolEvent, EventStatus, AgentStatus } from "@/lib/types";

function labelFor(event: ToolEvent): string {
  if (event.toolName === "bash") {
    return `bash: ${(event as { command: string }).command.slice(0, 40)}`;
  }
  if (event.toolName === "computer") {
    return (event as { action: string }).action;
  }
  return event.toolName;
}

const STATUS_DOT: Record<EventStatus, string> = {
  pending: "bg-amber-400",
  complete: "bg-green-500",
  error: "bg-red-500",
};

const AGENT_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Thinking…",
  executing: "Executing…",
};

const AGENT_COLOR: Record<AgentStatus, string> = {
  idle: "text-zinc-400",
  thinking: "text-amber-500",
  executing: "text-blue-500",
};

export function DebugPanel() {
  const toolCalls = useToolStore((s) => s.toolCalls);
  const actionCounts = useToolStore((s) => s.actionCounts);
  const agentStatus = useToolStore((s) => s.agentStatus);
  const selectedId = useToolStore((s) => s.selectedToolCallId);
  const selectToolCall = useToolStore((s) => s.selectToolCall);

  return (
    <details className="group shrink-0 border-t border-zinc-200 bg-zinc-50">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 list-none [&::-webkit-details-marker]:hidden hover:bg-zinc-100/50">
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
        Event log
        {toolCalls.length > 0 && (
          <span className="text-xs text-zinc-400">{toolCalls.length}</span>
        )}
        <span className={`ml-auto flex items-center gap-1.5 text-xs ${AGENT_COLOR[agentStatus]}`}>
          {agentStatus !== "idle" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {AGENT_LABEL[agentStatus]}
        </span>
      </summary>

      <div className="border-b border-zinc-200">
        {/* Counts per action type */}
        {Object.keys(actionCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-2">
            {Object.entries(actionCounts).map(([action, count]) => (
              <span
                key={action}
                className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600"
              >
                {action}
                <span className="font-semibold">{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Event timeline */}
      <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100">
        {toolCalls.length === 0 ? (
          <p className="px-4 py-3 text-xs text-zinc-400">No events yet.</p>
        ) : (
          toolCalls.map((tc) => (
            <button
              key={tc.toolCallId}
              onClick={() =>
                selectToolCall(selectedId === tc.toolCallId ? null : tc.toolCallId)
              }
              className={`flex items-center gap-2 w-full px-4 py-1.5 text-left text-xs hover:bg-zinc-100 transition-colors ${selectedId === tc.toolCallId
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-600"
                }`}
            >
              <span className="truncate flex-1">{labelFor(tc)}</span>
              <span
                className={`shrink-0 h-1.5 w-1.5 rounded-full ${STATUS_DOT[tc.status]}`}
              />
            </button>
          ))
        )}
      </div>
    </details>
  );
}
