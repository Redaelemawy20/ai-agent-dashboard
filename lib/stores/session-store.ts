import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearMessages } from "./session-helpers";

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

export function createNewSession(): Session {
  return {
    id: generateId(),
    title: "New chat",
    createdAt: Date.now(),
  };
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
