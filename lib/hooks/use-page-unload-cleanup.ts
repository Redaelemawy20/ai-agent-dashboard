"use client";

import { useEffect } from "react";
import { isIOS, isSafari } from "@/lib/utils";

export function usePageUnloadCleanup(sandboxId: string | null): void {
  useEffect(() => {
    if (!sandboxId) return;

    const kill = () =>
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );

    if (isIOS() || isSafari()) {
      window.addEventListener("pagehide", kill);
      return () => {
        window.removeEventListener("pagehide", kill);
        kill();
      };
    }

    window.addEventListener("beforeunload", kill);
    return () => {
      window.removeEventListener("beforeunload", kill);
      kill();
    };
  }, [sandboxId]);
}
