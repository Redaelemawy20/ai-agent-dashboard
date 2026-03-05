"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import equal from "fast-deep-equal";

import { cn } from "@/lib/utils";
import type { ChatStatus } from "@/lib/types";
import { BashToolPart } from "@/components/message-parts/bash-tool-part";
import { ComputerToolPart } from "@/components/message-parts/computer-tool-part";
import { TextPart } from "@/components/message-parts/text-part";

const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
}: {
  message: Message;
  isLoading: boolean;
  status: ChatStatus;
  isLatestMessage: boolean;
}) => {
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
                    <TextPart
                      key={`message-${message.id}-part-${i}`}
                      message={message}
                      part={part}
                    />
                  );
                case "tool-invocation": {
                  const { toolName, toolCallId, state, args } =
                    part.toolInvocation;
                  if (toolName === "computer") {
                    return (
                      <ComputerToolPart
                        key={`message-${message.id}-part-${i}`}
                        part={part}
                        isLatestMessage={isLatestMessage}
                        status={status}
                      />
                    );
                  }
                  if (toolName === "bash") {
                    return (
                      <BashToolPart
                        key={`message-${message.id}-part-${i}`}
                        part={part}
                        isLatestMessage={isLatestMessage}
                        status={status}
                      />
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
                }

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
