"use client";

import {
  getComputerActionDisplay,
  getToolResultImage,
  getToolResultText,
} from "@/lib/message-preview-helpers";
import { ToolInvocationCard } from "./tool-invocation-card";
import type { ToolPartProps } from "./types";

export function ComputerToolPart({
  part,
  isLatestMessage,
  status,
}: ToolPartProps) {
  const { toolCallId, state, args, result } = part.toolInvocation;
  const action = (args.action as string) ?? "";
  const { actionLabel, actionDetail, ActionIcon } =
    getComputerActionDisplay(action, args);

  return (
    <ToolInvocationCard
      toolCallId={toolCallId}
      state={state}
      result={result}
      isLatestMessage={isLatestMessage}
      status={status}
      layoutClassName="flex flex-col gap-2"
    >
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded-full">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="font-medium font-mono flex items-baseline gap-2">
            {actionLabel}
            {actionDetail && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {actionDetail}
              </span>
            )}
          </div>
        </div>
      </div>
      {state === "result" ? (
        (() => {
          const img = result != null ? getToolResultImage(result) : null;
          const text = result != null ? getToolResultText(result) : null;
          if (img) {
            return (
              <div className="p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${img.data}`}
                  alt="Screenshot"
                  className="max-w-28 w-full aspect-video object-cover rounded-sm border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            );
          }
          if (text != null) {
            return (
              <div className="p-2 text-[10px] text-zinc-500 italic">
                {text}
              </div>
            );
          }
          return null;
        })()
      ) : action === "screenshot" ? (
        <div className="max-w-28 w-full aspect-video rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      ) : null}
    </ToolInvocationCard>
  );
}
