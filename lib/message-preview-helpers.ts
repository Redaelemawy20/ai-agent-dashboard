import {
  Camera,
  Clock,
  Keyboard,
  KeyRound,
  MousePointer,
  MousePointerClick,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { ABORTED } from "@/lib/utils";
import type { ToolResult, ToolArgs } from "@/lib/types";

export function isToolResultAborted(result: ToolResult | undefined): boolean {
  return result === ABORTED;
}

export function getToolResultImage(
  result: ToolResult
): { type: "image"; data: string } | null {
  if (
    result != null &&
    typeof result === "object" &&
    "type" in result &&
    (result as { type: string }).type === "image" &&
    "data" in result
  ) {
    return { type: "image", data: String((result as { data: string }).data) };
  }
  return null;
}

export function getToolResultText(result: ToolResult): string | null {
  if (
    result != null &&
    typeof result === "object" &&
    "text" in result &&
    typeof (result as { text: unknown }).text === "string"
  ) {
    return (result as { text: string }).text;
  }
  return null;
}

/**
 * Returns the display string for a tool result (e.g. bash output).
 */
export function formatToolResult(result: ToolResult): string | null {
  if (result == null) return null;
  if (result === ABORTED) return ABORTED;
  if (typeof result === "string") return result;
  const text = getToolResultText(result);
  return text != null ? text : null;
}

export function getComputerActionDisplay(
  action: string,
  args: ToolArgs,
): {
  actionLabel: string;
  actionDetail: string;
  ActionIcon: LucideIcon | null;
} {
  const coordinate = args.coordinate as [number, number] | undefined;
  const text = args.text as string | undefined;
  const duration = args.duration as number | undefined;
  const scroll_amount = args.scroll_amount as number | undefined;
  const scroll_direction = args.scroll_direction as string | undefined;

  const formatCoord = (prefix: "at" | "to") =>
    coordinate ? `${prefix} (${coordinate[0]}, ${coordinate[1]})` : "";
  const formatText = () => (text ? `"${text}"` : "");

  switch (action) {
    case "screenshot":
      return {
        actionLabel: "Taking screenshot",
        actionDetail: "",
        ActionIcon: Camera,
      };
    case "left_click":
      return {
        actionLabel: "Left clicking",
        actionDetail: formatCoord("at"),
        ActionIcon: MousePointer,
      };
    case "right_click":
      return {
        actionLabel: "Right clicking",
        actionDetail: formatCoord("at"),
        ActionIcon: MousePointerClick,
      };
    case "double_click":
      return {
        actionLabel: "Double clicking",
        actionDetail: formatCoord("at"),
        ActionIcon: MousePointerClick,
      };
    case "mouse_move":
      return {
        actionLabel: "Moving mouse",
        actionDetail: formatCoord("to"),
        ActionIcon: MousePointer,
      };
    case "type":
      return {
        actionLabel: "Typing",
        actionDetail: formatText(),
        ActionIcon: Keyboard,
      };
    case "key":
      return {
        actionLabel: "Pressing key",
        actionDetail: formatText(),
        ActionIcon: KeyRound,
      };
    case "wait":
      return {
        actionLabel: "Waiting",
        actionDetail: duration ? `${duration} seconds` : "",
        ActionIcon: Clock,
      };
    case "scroll":
      return {
        actionLabel: "Scrolling",
        actionDetail:
          scroll_direction && scroll_amount
            ? `${scroll_direction} by ${scroll_amount}`
            : "",
        ActionIcon: ScrollText,
      };
    default:
      return {
        actionLabel: action,
        actionDetail: "",
        ActionIcon: MousePointer,
      };
  }
}
