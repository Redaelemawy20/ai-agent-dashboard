"use client";

import { AISDKLogo } from "@/components/icons";
import { DeployButton } from "@/components/project-info";
import { Chat } from "@/components/chat";
import { DebugPanel } from "@/components/debug-panel";
import { SessionSidebar } from "@/components/session-sidebar";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { useSessionStore, createNewSession } from "@/lib/session-store";
import { useToolStore } from "@/lib/tool-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { VncPanel } from "@/components/vnc-panel";
import { ExpandedToolDetail } from "@/components/expanded-tool-detail";
import { Modal } from "@/components/ui/modal";
import { Monitor, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarOverlay } from "@/components/sidebar-overlay";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

async function killDesktopApi(sandboxId: string): Promise<void> {
  try {
    await fetch(
      `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`,
      { method: "POST" }
    );
  } catch (e) {
    console.error("Failed to kill desktop:", e);
  }
}

export default function ChatPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [showVncOnMobile, setShowVncOnMobile] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [sidebarCollapsedDesktop, setSidebarCollapsedDesktop] = useState(false);
  const prevActiveSessionIdRef = useRef<string | null>(null);
  const sandboxIdRef = useRef<string | null>(null);
  sandboxIdRef.current = sandboxId;

  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const selectedToolCallId = useToolStore((s) => s.selectedToolCallId);
  const selectToolCall = useToolStore((s) => s.selectToolCall);
  const hasHydrated = useSessionStore((s) => s._hasHydrated);
  const addSession = useSessionStore((s) => s.addSession);
  const resetToolStore = useToolStore((s) => s.reset);

  // Ensure at least one session exists after localStorage has loaded
  useEffect(() => {
    if (!hasHydrated || sessions.length > 0) return;
    const session = createNewSession();
    addSession(session);
  }, [hasHydrated, sessions.length, addSession]);

  // Sandbox lifecycle: create when active session exists, kill previous when switching
  useEffect(() => {
    if (!activeSessionId) return;

    const prevSessionId = prevActiveSessionIdRef.current;
    prevActiveSessionIdRef.current = activeSessionId;

    // Reset tool store when switching sessions
    if (prevSessionId !== activeSessionId) {
      resetToolStore();
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
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Kill desktop on page close
  useEffect(() => {
    if (!sandboxId) return;
    const kill = () =>
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`
      );
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS || isSafari) {
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



  return (
    <div className="flex h-dvh relative">


      {/* Desktop layout */}
      <div className="w-full hidden xl:flex h-full relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            className="flex flex-col border-r border-zinc-200"
          >
            <div className="flex h-full min-w-0">
              {!sidebarCollapsedDesktop && (
                <SessionSidebar isInitializing={isInitializing} />
              )}
              <div className="flex flex-col h-full flex-1 min-w-0">
                <div className="bg-white py-4 px-4 flex justify-between items-center shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSidebarCollapsedDesktop((v) => !v)}
                      aria-label="Toggle sidebar"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <AISDKLogo />
                  </div>
                  <DeployButton />
                </div>
                <Chat
                  sessionId={activeSessionId}
                  sandboxId={sandboxId}
                  isInitializing={isInitializing}
                />
                <DebugPanel />
              </div>
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
            <ExpandedToolDetail />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile layout */}
      <div className="w-full xl:hidden flex flex-col h-dvh">
        <div className="bg-white py-4 px-4 flex justify-between items-center shrink-0 gap-2 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSidebarOpenMobile((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <AISDKLogo />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowVncOnMobile((v) => !v)}
              aria-pressed={showVncOnMobile}
              aria-label={showVncOnMobile ? "View chat" : "View desktop"}
            >
              {showVncOnMobile ? (
                <>
                  <MessageSquare className="h-3.5 w-3.5" />
                  View chat
                </>
              ) : (
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  View desktop
                </>
              )}
            </Button>
            <DeployButton />
          </div>
        </div>
        <div className="flex flex-1 min-h-0 min-w-0">
          {showVncOnMobile ? (
            <div className="flex flex-col flex-1 min-w-0 bg-black relative">
              <div className="flex-1 min-h-0">
                <VncPanel
                  streamUrl={streamUrl}
                  isInitializing={isInitializing}
                  onRefreshDesktop={refreshDesktop}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-w-0 h-full min-h-0">
              <Chat
                sessionId={activeSessionId}
                sandboxId={sandboxId}
                isInitializing={isInitializing}
              />
              <DebugPanel />
            </div>
          )}
        </div>
      </div>

      {/* Tool detail modal on mobile - opens when user clicks a tool call */}
      <div className="xl:hidden">
        <Modal
          isOpen={!!selectedToolCallId}
          onClose={() => selectToolCall(null)}
        >
          <ExpandedToolDetail variant="modal" />
        </Modal>
      </div>

      {/* Sidebar overlay on mobile */}
      <div className="xl:hidden">
        <SidebarOverlay
          isOpen={sidebarOpenMobile}
          onClose={() => setSidebarOpenMobile(false)}
        >
          <SessionSidebar isInitializing={isInitializing} />
        </SidebarOverlay>
      </div>
    </div>
  );
}
