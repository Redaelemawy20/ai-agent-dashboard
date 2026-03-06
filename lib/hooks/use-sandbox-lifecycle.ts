"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { killDesktopApi, getSandboxStatusApi } from "@/lib/sandbox/client";

const SANDBOX_STATUS_POLL_MS = 30_000;

export interface UseSandboxLifecycleParams {
  activeSessionId: string | null;
}

export interface UseSandboxLifecycleResult {
  streamUrl: string | null;
  sandboxId: string | null;
  isInitializing: boolean;
  refreshDesktop: () => Promise<void>;
}

export function useSandboxLifecycle({
  activeSessionId,
}: UseSandboxLifecycleParams): UseSandboxLifecycleResult {
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  const initInFlightRef = useRef(false);

  // Create desktop only when needed and we don't have one; do NOT recreate on session switch/create
  useEffect(() => {
    if (!activeSessionId) return;
    if (sandboxId) return;
    if (initInFlightRef.current) return;

    let cancelled = false;
    initInFlightRef.current = true;

    const init = async () => {
      try {
        setIsInitializing(true);
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
  }, [activeSessionId, sandboxId]);

  const refreshDesktopRef = useRef<(() => Promise<void>) | null>(null);

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

  refreshDesktopRef.current = refreshDesktop;

  // Poll sandbox status; refresh when no longer running (ephemeral timeout)
  useEffect(() => {
    if (!sandboxId || isInitializing) return;

    const interval = setInterval(async () => {
      if (initInFlightRef.current) return;
      const result = await getSandboxStatusApi(sandboxId);
      if (result && result.status !== "running") {
        refreshDesktopRef.current?.();
        toast.info("Sandbox expired, creating new desktop");
      }
    }, SANDBOX_STATUS_POLL_MS);

    return () => clearInterval(interval);
  }, [sandboxId, isInitializing]);

  return {
    streamUrl,
    sandboxId,
    isInitializing,
    refreshDesktop,
  };
}
