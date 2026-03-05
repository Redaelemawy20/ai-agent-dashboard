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

  syncFromMessages: (messages: Message[]) => void;
  setAgentStatus: (status: AgentStatus) => void;
  selectToolCall: (id: string | null) => void;
  reset: () => void;
}

const timings = new Map<string, TimingEntry>();

export const useToolStore = create<ToolStore>((set) => ({
  toolCalls: [],
  actionCounts: {},
  selectedToolCallId: null,
  agentStatus: "idle",

  syncFromMessages: (messages) => {
    const toolCalls = syncToolEvents(messages, timings);
    set({ toolCalls, actionCounts: countByAction(toolCalls) });
  },

  setAgentStatus: (agentStatus) => set({ agentStatus }),

  selectToolCall: (id) => set({ selectedToolCallId: id }),

  reset: () => {
    timings.clear();
    set({ toolCalls: [], actionCounts: {}, selectedToolCallId: null });
  },
}));
