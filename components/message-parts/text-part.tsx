"use client";

import { memo } from "react";
import type { Message } from "ai";
import { motion } from "motion/react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export interface TextPartProps {
  message: Message;
  part: { type: "text"; text: string };
}

export const TextPart = memo(function TextPart({ message, part }: TextPartProps) {
  return (
    <motion.div
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
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
});
