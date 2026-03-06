import { create } from "zustand";
import type { Message } from "ai";
import type { ToolEvent, ActionCounts, AgentStatus } from "@/lib/types";
import {
  syncToolEvents,
  countByAction,
  type TimingEntry,
} from "./tool-helpers";

interface ToolStore {
  toolCalls: ToolEvent[];
  actionCounts: ActionCounts;
  selectedToolCallId: string | null;
  agentStatus: AgentStatus;

  syncFromMessages: (messages: Message[], sessionId: string | null) => void;
  getTimingsSnapshot: () => Record<string, TimingEntry>;
  setAgentStatus: (status: AgentStatus) => void;
  selectToolCall: (id: string | null) => void;
  reset: () => void;
}

const timings = new Map<string, TimingEntry>();
let prevSessionId: string | null = null;

export const useToolStore = create<ToolStore>((set) => ({
  toolCalls: [],
  actionCounts: {},
  selectedToolCallId: null,
  agentStatus: "idle",

  syncFromMessages: (messages, sessionId) => {
    if (sessionId !== prevSessionId) {
      timings.clear();
      prevSessionId = sessionId;
    }
    const toolCalls = syncToolEvents(messages, timings);
    set({ toolCalls, actionCounts: countByAction(toolCalls) });
  },

  getTimingsSnapshot: () => Object.fromEntries(timings),

  setAgentStatus: (agentStatus) => set({ agentStatus }),

  selectToolCall: (id) => set({ selectedToolCallId: id }),

  reset: () => {
    timings.clear();
    prevSessionId = null;
    set({
      toolCalls: [],
      actionCounts: {},
      selectedToolCallId: null,
      agentStatus: "idle",
    });
  },
}));
