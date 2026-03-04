"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { killDesktopApi } from "@/lib/sandbox/client";

export interface UseSandboxLifecycleParams {
  activeSessionId: string | null;
  onSessionSwitch?: () => void;
}

export interface UseSandboxLifecycleResult {
  streamUrl: string | null;
  sandboxId: string | null;
  isInitializing: boolean;
  refreshDesktop: () => Promise<void>;
}

export function useSandboxLifecycle({
  activeSessionId,
  onSessionSwitch,
}: UseSandboxLifecycleParams): UseSandboxLifecycleResult {
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  const prevActiveSessionIdRef = useRef<string | null>(null);
  const sandboxIdRef = useRef<string | null>(null);
  sandboxIdRef.current = sandboxId;

  const onSessionSwitchRef = useRef(onSessionSwitch);
  onSessionSwitchRef.current = onSessionSwitch;

  // Sandbox lifecycle: create when active session exists, kill previous when switching
  useEffect(() => {
    if (!activeSessionId) return;

    const prevSessionId = prevActiveSessionIdRef.current;
    prevActiveSessionIdRef.current = activeSessionId;

    if (prevSessionId !== activeSessionId) {
      onSessionSwitchRef.current?.();
    }

    let cancelled = false;
    const prevSandboxId = sandboxIdRef.current;

    const init = async () => {
      if (prevSandboxId && prevSessionId !== activeSessionId) {
        await killDesktopApi(prevSandboxId);
      }

      try {
        setIsInitializing(true);
        setStreamUrl(null);
        setSandboxId(null);
        const { streamUrl: url, id } = await getDesktopURL();
        if (cancelled) return;
        setStreamUrl(url);
        setSandboxId(id);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to initialize desktop:", err);
          toast.error("Failed to initialize desktop");
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  const refreshDesktop = useCallback(async () => {
    try {
      setIsInitializing(true);
      if (sandboxId) await killDesktopApi(sandboxId);
      const { streamUrl: url, id } = await getDesktopURL();
      setStreamUrl(url);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [sandboxId]);

  return {
    streamUrl,
    sandboxId,
    isInitializing,
    refreshDesktop,
  };
}
