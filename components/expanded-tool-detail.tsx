"use client";

import { memo } from "react";
import { useToolStore } from "@/lib/stores/tool-store";
import { isComputerEvent, type EventStatus } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { formatToolResult, getToolResultImage } from "@/lib/message-preview-helpers";
import { Camera, ScrollText, MousePointer, X } from "lucide-react";

const STATUS_BADGE: Record<EventStatus, { bg: string; label: string }> = {
  pending: { bg: "bg-amber-400", label: "Pending" },
  complete: { bg: "bg-green-500", label: "Complete" },
  error: { bg: "bg-red-500", label: "Error" },
};

interface ExpandedToolDetailProps {
  variant?: "inline" | "modal";
}

export const ExpandedToolDetail = memo(function ExpandedToolDetail({ variant = "inline" }: ExpandedToolDetailProps) {
  const selectedId = useToolStore((s) => s.selectedToolCallId);
  const toolCalls = useToolStore((s) => s.toolCalls);
  const selectToolCall = useToolStore((s) => s.selectToolCall);

  const selected = selectedId
    ? toolCalls.find((tc) => tc.toolCallId === selectedId)
    : null;

  if (!selected) return null;

  const isScreenshot =
    isComputerEvent(selected) && selected.action === "screenshot";
  const isBash = selected.toolName === "bash";
  const imageResult =
    selected.result != null ? getToolResultImage(selected.result) : null;
  const badge =
    STATUS_BADGE[selected.status] ?? { bg: "bg-zinc-500", label: "Unknown" };

  const wrapperClassName =
    variant === "modal"
      ? "flex flex-col h-full bg-zinc-900 text-zinc-100 rounded-lg shadow-xl overflow-hidden"
      : "absolute bottom-0 left-0 right-0 bg-zinc-900 text-zinc-100 border-t border-zinc-700 max-h-[40%] overflow-y-auto";

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700/50 shrink-0">
        <div className="flex items-center gap-3 text-base font-medium">
          {isBash ? (
            <ScrollText className="h-5 w-5 shrink-0 text-zinc-300" />
          ) : isScreenshot ? (
            <Camera className="h-5 w-5 shrink-0 text-zinc-300" />
          ) : (
            <MousePointer className="h-5 w-5 shrink-0 text-zinc-300" />
          )}
          <span className="text-zinc-100">
            {selected.toolName}
            {isComputerEvent(selected) ? ` / ${selected.action}` : ""}
          </span>
          <span className={`h-2 w-2 shrink-0 rounded-full ${badge.bg}`} />
          <span className="text-xs font-medium text-zinc-400">{badge.label}</span>
          <span className="text-sm font-medium text-zinc-300 tabular-nums">
            {formatDuration(selected.duration)}
          </span>
        </div>
        <button
          onClick={() => selectToolCall(null)}
          className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className={
          variant === "modal"
            ? "flex-1 overflow-y-auto min-h-0 p-5 space-y-4 text-sm"
            : "p-5 space-y-4 text-sm"
        }
      >
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-400">
          <span>
            <span className="font-medium text-zinc-500">ID:</span>{" "}
            {selected.toolCallId}
          </span>
          <span>
            <span className="font-medium text-zinc-500">Time:</span>{" "}
            {new Date(selected.timestamp).toLocaleTimeString()}
          </span>
          <span>
            <span className="font-medium text-zinc-500">Duration:</span>{" "}
            {formatDuration(selected.duration)}
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Args
          </span>
          <pre className="text-sm p-3 bg-zinc-800 rounded-lg overflow-x-auto text-zinc-200 leading-relaxed">
            {JSON.stringify(selected.args, null, 2)}
          </pre>
        </div>

        {selected.result != null && (
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Result
            </span>
            {imageResult ? (
              <img
                src={`data:image/png;base64,${imageResult.data}`}
                alt="Screenshot"
                className="mt-2 w-full max-w-4xl rounded-lg border border-zinc-700"
              />
            ) : (
              <pre className="text-sm p-3 bg-zinc-800 rounded-lg overflow-x-auto max-h-40 text-zinc-200 leading-relaxed">
                {formatToolResult(selected.result) ??
                  JSON.stringify(selected.result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
