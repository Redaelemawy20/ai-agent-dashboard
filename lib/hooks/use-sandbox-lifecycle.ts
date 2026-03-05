"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { killDesktopApi } from "@/lib/sandbox/client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

const SANDBOX_DEBOUNCE_MS = 400;

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
  const initInFlightRef = useRef(false);

  const onSessionSwitchRef = useRef(onSessionSwitch);
  onSessionSwitchRef.current = onSessionSwitch;

  const debouncedSessionId = useDebouncedValue(
    activeSessionId,
    SANDBOX_DEBOUNCE_MS
  );

  // Reset tool store immediately when session changes (no debounce)
  useEffect(() => {
    if (!activeSessionId) return;
    const prev = prevActiveSessionIdRef.current;
    prevActiveSessionIdRef.current = activeSessionId;
    if (prev !== activeSessionId) {
      onSessionSwitchRef.current?.();
    }
  }, [activeSessionId]);

  // Sandbox lifecycle: debounced kill + create when session settles
  useEffect(() => {
    if (!debouncedSessionId) return;
    if (initInFlightRef.current) return;

    let cancelled = false;
    const prevSandboxId = sandboxIdRef.current;
    initInFlightRef.current = true;

    const init = async () => {
      if (prevSandboxId) {
        killDesktopApi(prevSandboxId).catch(() => {});
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
        initInFlightRef.current = false;
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [debouncedSessionId]);

  const refreshDesktop = useCallback(async () => {
    if (initInFlightRef.current) {
      toast.error("Please wait for the desktop to finish loading");
      return;
    }
    try {
      initInFlightRef.current = true;
      setIsInitializing(true);
      if (sandboxId) await killDesktopApi(sandboxId);
      const { streamUrl: url, id } = await getDesktopURL();
      setStreamUrl(url);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
      toast.error("Failed to refresh desktop");
    } finally {
      setIsInitializing(false);
      initInFlightRef.current = false;
    }
  }, [sandboxId]);

  return {
    streamUrl,
    sandboxId,
    isInitializing,
    refreshDesktop,
  };
}
