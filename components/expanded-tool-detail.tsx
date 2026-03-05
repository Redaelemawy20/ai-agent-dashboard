"use client";

import { useToolStore } from "@/lib/tool-store";
import { isComputerEvent } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { formatToolResult, getToolResultImage } from "@/lib/message-preview-helpers";
import { Camera, ScrollText, MousePointer, X } from "lucide-react";

const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  pending: { bg: "bg-amber-400", label: "Pending" },
  complete: { bg: "bg-green-500", label: "Complete" },
  error: { bg: "bg-red-500", label: "Error" },
};

interface ExpandedToolDetailProps {
  variant?: "inline" | "modal";
}

export function ExpandedToolDetail({ variant = "inline" }: ExpandedToolDetailProps) {
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700/50 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isBash ? (
            <ScrollText className="h-4 w-4" />
          ) : isScreenshot ? (
            <Camera className="h-4 w-4" />
          ) : (
            <MousePointer className="h-4 w-4" />
          )}
          <span>
            {selected.toolName}
            {isComputerEvent(selected) ? ` / ${selected.action}` : ""}
          </span>
          <span className={`h-1.5 w-1.5 rounded-full ${badge.bg}`} />
          <span className="text-[10px] text-zinc-400">{badge.label}</span>
          <span className="text-[10px] text-zinc-500 tabular-nums">
            {formatDuration(selected.duration)}
          </span>
        </div>
        <button
          onClick={() => selectToolCall(null)}
          className="p-1 hover:bg-zinc-700 rounded"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className={
          variant === "modal"
            ? "flex-1 overflow-y-auto min-h-0 p-4 space-y-3 text-xs"
            : "p-4 space-y-3 text-xs"
        }
      >
        <div className="flex gap-4 text-[10px] text-zinc-500">
          <span>ID: {selected.toolCallId}</span>
          <span>
            Time: {new Date(selected.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div>
          <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
            Args
          </span>
          <pre className="mt-1 p-2 bg-zinc-800 rounded overflow-x-auto">
            {JSON.stringify(selected.args, null, 2)}
          </pre>
        </div>

        {selected.result != null && (
          <div>
            <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
              Result
            </span>
            {imageResult ? (
              <img
                src={`data:image/png;base64,${imageResult.data}`}
                alt="Screenshot"
                className="mt-1 w-full max-w-4xl rounded border border-zinc-700"
              />
            ) : (
              <pre className="mt-1 p-2 bg-zinc-800 rounded overflow-x-auto max-h-40">
                {formatToolResult(selected.result) ??
                  JSON.stringify(selected.result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
