import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "computer-use-sessions";

export interface Session {
  id: string;
  title: string;
  createdAt: number;
}

interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  activeSessionHasMessages: boolean;
  _hasHydrated: boolean;

  addSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setActiveSessionHasMessages: (has: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  updateSessionTitle: (id: string, title: string) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      activeSessionHasMessages: false,
      _hasHydrated: false,

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
        })),

      deleteSession: (id) => {
        clearMessages(id);
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id);
          const activeSessionId =
            state.activeSessionId === id
              ? sessions[0]?.id ?? null
              : state.activeSessionId;
          return { sessions, activeSessionId };
        });
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      setActiveSessionHasMessages: (has) =>
        set({ activeSessionHasMessages: has }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      updateSessionTitle: (id, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title } : s
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state && state.sessions.length === 0) {
          state.addSession(createNewSession());
        }
      },
    }
  )
);

export function createNewSession(): Session {
  return {
    id: generateId(),
    title: "New chat",
    createdAt: Date.now(),
  };
}

const MESSAGES_KEY_PREFIX = "chat-messages-";

export function getMessagesKey(sessionId: string): string {
  return `${MESSAGES_KEY_PREFIX}${sessionId}`;
}

export function loadMessages(sessionId: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getMessagesKey(sessionId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(sessionId: string, messages: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getMessagesKey(sessionId),
      JSON.stringify(messages)
    );
  } catch (e) {
    console.error("Failed to save messages:", e);
  }
}

export function clearMessages(sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getMessagesKey(sessionId));
}
