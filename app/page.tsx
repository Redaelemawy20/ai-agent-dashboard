"use client";

import { AISDKLogo } from "@/components/icons";
import { DeployButton } from "@/components/project-info";
import { Chat } from "@/components/chat";
import { DebugPanel } from "@/components/debug-panel";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { VncPanel } from "@/components/vnc-panel";
import { ExpandedToolDetail } from "@/components/expanded-tool-detail";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ChatPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [selectedToolCallId, setSelectedToolCallId] = useState<string | null>(
    null
  );

  const refreshDesktop = useCallback(async () => {
    try {
      setIsInitializing(true);
      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      setStreamUrl(streamUrl);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [sandboxId]);

  // Kill desktop on page close
  useEffect(() => {
    if (!sandboxId) return;

    const killDesktop = () => {
      if (!sandboxId) return;
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    };

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(
      navigator.userAgent
    );

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => {
        window.removeEventListener("pagehide", killDesktop);
        killDesktop();
      };
    } else {
      window.addEventListener("beforeunload", killDesktop);
      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        killDesktop();
      };
    }
  }, [sandboxId]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        const { streamUrl, id } = await getDesktopURL(sandboxId ?? undefined);
        setStreamUrl(streamUrl);
        setSandboxId(id);
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh relative">
      {/* Mobile/tablet banner */}
      <div className="flex items-center justify-center fixed left-1/2 -translate-x-1/2 top-5 shadow-md text-xs mx-auto rounded-lg h-8 w-fit bg-blue-600 text-white px-3 py-2 text-left z-50 xl:hidden">
        <span>Headless mode</span>
      </div>

      {/* Resizable Panels - Chat left, VNC right */}
      <div className="w-full hidden xl:block">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            className="flex flex-col border-r border-zinc-200"
          >
            <div className="flex flex-col h-full">
              <div className="bg-white py-4 px-4 flex justify-between items-center shrink-0">
                <AISDKLogo />
                <DeployButton />
              </div>
              <Chat
                sandboxId={sandboxId}
                isInitializing={isInitializing}
              />
              <DebugPanel />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={70}
            minSize={40}
            className="flex flex-col bg-black relative"
          >
            <div className="flex-1 min-h-0">
              <VncPanel
                streamUrl={streamUrl}
                isInitializing={isInitializing}
                onRefreshDesktop={refreshDesktop}
              />
            </div>
            <ExpandedToolDetail selectedToolCallId={selectedToolCallId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile View (Chat Only) */}
      <div className="w-full xl:hidden flex flex-col h-dvh">
        <div className="flex flex-col h-full">
          <div className="bg-white py-4 px-4 flex justify-between items-center shrink-0">
            <AISDKLogo />
            <DeployButton />
          </div>
          <Chat
            sandboxId={sandboxId}
            isInitializing={isInitializing}
          />
          <DebugPanel />
        </div>
      </div>
    </div>
  );
}
