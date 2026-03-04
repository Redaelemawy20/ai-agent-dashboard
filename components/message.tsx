"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback } from "react";
import equal from "fast-deep-equal";
import { Streamdown } from "streamdown";

import { ABORTED, cn } from "@/lib/utils";
import { useToolStore } from "@/lib/tool-store";
import {
  Camera,
  CheckCircle,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  StopCircle,
} from "lucide-react";

const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
}: {
  message: Message;
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
}) => {
  const selectToolCall = useToolStore((s) => s.selectToolCall);
  const selectedId = useToolStore((s) => s.selectedToolCallId);

  const handleToolCallClick = useCallback(
    (toolCallId: string) => {
      selectToolCall(selectedId === toolCallId ? null : toolCallId);
    },
    [selectToolCall, selectedId]
  );
  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="w-full mx-auto px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={`message-${message.id}`}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            "group-data-[role=user]/message:w-fit",
          )}
        >
          {/* {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )} */}

          <div className="flex flex-col w-full">
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-row gap-2 items-start w-full pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4", {
                          "bg-secondary text-secondary-foreground px-3 py-2 rounded-xl":
                            message.role === "user",
                        })}
                      >
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    </motion.div>
                  );
                case "tool-invocation":
                  const { toolName, toolCallId, state, args } =
                    part.toolInvocation;

                  if (toolName === "computer") {
                    const {
                      action,
                      coordinate,
                      text,
                      duration,
                      scroll_amount,
                      scroll_direction,
                    } = args;
                    let actionLabel = "";
                    let actionDetail = "";
                    let ActionIcon = null;

                    switch (action) {
                      case "screenshot":
                        actionLabel = "Taking screenshot";
                        ActionIcon = Camera;
                        break;
                      case "left_click":
                        actionLabel = "Left clicking";
                        actionDetail = coordinate
                          ? `at (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointer;
                        break;
                      case "right_click":
                        actionLabel = "Right clicking";
                        actionDetail = coordinate
                          ? `at (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "double_click":
                        actionLabel = "Double clicking";
                        actionDetail = coordinate
                          ? `at (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "mouse_move":
                        actionLabel = "Moving mouse";
                        actionDetail = coordinate
                          ? `to (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointer;
                        break;
                      case "type":
                        actionLabel = "Typing";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = Keyboard;
                        break;
                      case "key":
                        actionLabel = "Pressing key";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = KeyRound;
                        break;
                      case "wait":
                        actionLabel = "Waiting";
                        actionDetail = duration ? `${duration} seconds` : "";
                        ActionIcon = Clock;
                        break;
                      case "scroll":
                        actionLabel = "Scrolling";
                        actionDetail =
                          scroll_direction && scroll_amount
                            ? `${scroll_direction} by ${scroll_amount}`
                            : "";
                        ActionIcon = ScrollText;
                        break;
                      default:
                        actionLabel = action;
                        ActionIcon = MousePointer;
                        break;
                    }

                    return (
                      <motion.button
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        onClick={() => handleToolCallClick(toolCallId)}
                        className={cn(
                          "flex flex-col gap-2 p-2 mb-3 text-sm rounded-md border text-left w-full transition-colors",
                          selectedId === toolCallId
                            ? "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        )}
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
                          <div className="w-5 h-5 flex items-center justify-center">
                            {state === "call" ? (
                              isLatestMessage && status !== "ready" ? (
                                <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
                              ) : (
                                <StopCircle className="h-4 w-4 text-red-500" />
                              )
                            ) : state === "result" ? (
                              part.toolInvocation.result === ABORTED ? (
                                <CircleSlash
                                size={14}
                                className="text-amber-600"
                                />                              ) : (
                                <CheckCircle
                                  size={14}
                                  className="text-green-600"
                                />
                              )
                            ) : null}
                          </div>
                        </div>
                        {state === "result" ? (
                          part.toolInvocation.result.type === "image" ? (
                            <div className="p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`data:image/png;base64,${part.toolInvocation.result.data}`}
                                alt="Screenshot"
                                className="max-w-28 w-full aspect-video object-cover rounded-sm border border-zinc-200 dark:border-zinc-700"
                              />
                            </div>
                          ) : typeof part.toolInvocation.result === "object" &&
                            part.toolInvocation.result != null &&
                            "text" in part.toolInvocation.result ? (
                            <div className="p-2 text-[10px] text-zinc-500 italic">
                              {(part.toolInvocation.result as { text: string })
                                .text}
                            </div>
                          ) : null
                        ) : action === "screenshot" ? (
                          <div className="max-w-28 w-full aspect-video rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        ) : null}
                      </motion.button>
                    );
                  }
                  if (toolName === "bash") {
                    const command =
                      typeof args.command === "string" ? args.command : "";
                    const result =
                      state === "result" ? part.toolInvocation.result : null;
                    const output =
                      typeof result === "string"
                        ? result
                        : result === ABORTED
                          ? ABORTED
                          : result != null &&
                              typeof result === "object" &&
                              "text" in result
                            ? String((result as { text: string }).text)
                            : null;

                    return (
                      <motion.button
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        onClick={() => handleToolCallClick(toolCallId)}
                        className={cn(
                          "flex gap-2 p-2 mb-3 text-sm rounded-md border text-left w-full transition-colors",
                          selectedId === toolCallId
                            ? "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        )}
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
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          {state === "call" ? (
                            isLatestMessage && status !== "ready" ? (
                              <Loader2 className="animate-spin h-4 w-4 text-zinc-500" />
                            ) : (
                              <StopCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : state === "result" ? (
                            result === ABORTED ? (
                              <CircleSlash size={14} className="text-amber-600" />
                            ) : (
                              <CheckCircle
                                size={14}
                                className="text-green-600"
                              />
                            )
                          ) : null}
                        </div>
                      </motion.button>
                    );
                  }
                  return (
                    <div key={toolCallId}>
                      <h3>
                        {toolName}: {state}
                      </h3>
                      <pre>{JSON.stringify(args, null, 2)}</pre>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.message.annotations !== nextProps.message.annotations)
      return false;
    // if (prevProps.message.content !== nextProps.message.content) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
  },
);
