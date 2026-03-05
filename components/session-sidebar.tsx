"use client";

import { memo } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSessionStore,
  createNewSession,
  type Session,
} from "@/lib/stores/session-store";
import { cn } from "@/lib/utils";

export interface SessionSidebarProps {
  isInitializing?: boolean;
}

export const SessionSidebar = memo(function SessionSidebar({ isInitializing = false }: SessionSidebarProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeSessionHasMessages = useSessionStore(
    (s) => s.activeSessionHasMessages
  );
  const addSession = useSessionStore((s) => s.addSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const canNewChat = activeSessionHasMessages && !isInitializing;
  const canSwitchSession = !isInitializing;
  const canDelete = !isInitializing;

  const handleNewChat = () => {
    if (!canNewChat) return;
    const session = createNewSession();
    addSession(session);
  };

  const handleSelectSession = (session: Session) => {
    if (!canSwitchSession || session.id === activeSessionId) return;
    setActiveSession(session.id);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  return (
    <div className="flex flex-col w-52 shrink-0 border-r border-zinc-200 bg-zinc-50/50">
      <Button
        variant="outline"
        size="sm"
        className="m-2 gap-2"
        onClick={handleNewChat}
        disabled={!canNewChat}
        title={
          isInitializing
            ? "Please wait for desktop to initialize"
            : !activeSessionHasMessages
              ? "Start a conversation first"
              : undefined
        }
      >
        <Plus className="h-4 w-4" />
        New chat
      </Button>
      <div className="flex-1 overflow-y-auto min-h-0 px-1">
        {sessions.length === 0 ? (
          <p className="px-3 py-4 text-xs text-zinc-500">
            No chats yet. Start a new one.
          </p>
        ) : (
          <ul className="space-y-0.5 pb-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  role="button"
                  tabIndex={canSwitchSession ? 0 : -1}
                  onClick={() => handleSelectSession(session)}
                  onKeyDown={(e) => {
                    if (!canSwitchSession) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectSession(session);
                    }
                  }}
                  title={
                    isInitializing
                      ? "Please wait for desktop to initialize"
                      : undefined
                  }
                  aria-disabled={!canSwitchSession}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    canSwitchSession
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60",
                    activeSessionId === session.id
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="flex-1 truncate">{session.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                    if (canDelete) handleDeleteSession(e, session.id);
                  }}
                    disabled={!canDelete}
                    title={
                      isInitializing
                        ? "Please wait for desktop to initialize"
                        : undefined
                    }
                    className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={`Delete ${session.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});
