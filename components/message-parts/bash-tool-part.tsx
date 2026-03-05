"use client";

import { memo } from "react";
import { ScrollText } from "lucide-react";
import { formatToolResult } from "@/lib/message-preview-helpers";
import { ToolInvocationCard } from "./tool-invocation-card";
import type { ToolPartProps } from "./types";

export const BashToolPart = memo(function BashToolPart({
  part,
  isLatestMessage,
  status,
}: ToolPartProps) {
  const { toolCallId, state, args, result } = part.toolInvocation;
  const command = typeof args.command === "string" ? args.command : "";
  const output = result != null ? formatToolResult(result) : null;

  return (
    <ToolInvocationCard
      toolCallId={toolCallId}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
    >
      <div className="flex items-start pt-0.5">
        <div className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0">
          <ScrollText className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs text-zinc-600 dark:text-zinc-400 mb-1">
          $ {command}
        </div>
        {output != null && (
          <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded p-2 overflow-x-auto max-h-32 overflow-y-auto text-zinc-700 dark:text-zinc-300">
            {output}
          </pre>
        )}
      </div>
    </ToolInvocationCard>
  );
});
