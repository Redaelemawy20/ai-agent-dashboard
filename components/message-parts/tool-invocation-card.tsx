"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { CheckCircle, CircleSlash, Loader2, StopCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { isToolResultAborted } from "@/lib/message-preview-helpers";
import { useToolStore } from "@/lib/tool-store";
import type { ChatStatus } from "./types";

const toolCardBaseClasses =
  "p-2 mb-3 text-sm rounded-md border text-left w-full transition-colors";
const toolCardSelectedClasses =
  "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700";
const toolCardDefaultClasses =
  "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer";

export interface ToolInvocationCardProps {
  toolCallId: string;
  state: string;
  result?: unknown;
  isLatestMessage: boolean;
  status: ChatStatus;
  children: ReactNode;
  layoutClassName?: string;
}

export function ToolInvocationCard({
  toolCallId,
  state,
  result,
  isLatestMessage,
  status,
  children,
  layoutClassName,
}: ToolInvocationCardProps) {
  const selectToolCall = useToolStore((s) => s.selectToolCall);
  const selectedId = useToolStore((s) => s.selectedToolCallId);
  const handleClick = useCallback(
    () => selectToolCall(selectedId === toolCallId ? null : toolCallId),
    [selectToolCall, selectedId, toolCallId]
  );

  return (
    <motion.button
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={handleClick}
      className={cn(
        layoutClassName ?? "flex gap-2",
        toolCardBaseClasses,
        selectedId === toolCallId ? toolCardSelectedClasses : toolCardDefaultClasses
      )}
    >
      {children}
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {state === "call" ? (
          isLatestMessage && status !== "ready" ? (
            <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
          ) : (
            <StopCircle className="h-4 w-4 text-red-500" />
          )
        ) : state === "result" ? (
          isToolResultAborted(result) ? (
            <CircleSlash size={14} className="text-amber-600" />
          ) : (
            <CheckCircle size={14} className="text-green-600" />
          )
        ) : null}
      </div>
    </motion.button>
  );
}
