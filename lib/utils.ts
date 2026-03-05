import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ABORTED = "User aborted";

export function formatDuration(ms: number | null): string {
  if (ms === null) return "pending…";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function getChatErrorMessage(
  error: unknown
): { title: string; description: string } {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("network"))
    return {
      title: "Connection error",
      description: "Check your internet connection and try again.",
    };
  if (lower.includes("unauthorized") || lower.includes("401"))
    return {
      title: "Authentication failed",
      description: "Check that your API key is configured correctly.",
    };
  if (lower.includes("rate limit") || lower.includes("429"))
    return {
      title: "Rate limit exceeded",
      description: "Please wait a moment and try again.",
    };
  if (lower.includes("internal server") || lower.includes("500"))
    return {
      title: "Server error",
      description: "Something went wrong on our end. Please try again.",
    };

  return {
    title: "Something went wrong",
    description: message && message.length < 100 ? message : "Please try again.",
  };
}
