import { create } from "zustand";
import { finalizeMilestone, proposeNextStep } from "@/services/aiRoadmap";

export interface RoadmapDraft {
  id?: string;
  title?: string;
  milestones: Array<{ id: string; title: string; tasks: string[] }>;
  confidence: number; // 0..1
}

export type OnboardingMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

interface OnboardingState {
  hasRoadmap: boolean;
  threadId: string;
  messages: OnboardingMessage[];
  draft: RoadmapDraft;
  sending: boolean;
  suggestion: { id: string; title: string; tasks: string[] } | null;
  send: (text: string) => Promise<void>;
  lockStep: () => Promise<void>;
  skip: () => void;
}

const initialAssistant = [
  "\uD83D\uDC4B I’m your mentor. Let’s craft your roadmap together. I’ll ask a couple of tiny questions and build the first sprint for you.",
  "First—how are you feeling today, and what’s one thing you want to improve?",
];


export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasRoadmap: false,
  threadId: crypto.randomUUID(),
  messages: initialAssistant.map((content) => ({
    id: crypto.randomUUID(),
    role: "assistant" as const,
    content,
  })),
  draft: { milestones: [], confidence: 0 },
  sending: false,
  suggestion: null,
  send: async (text: string) => {
    const userMsg: OnboardingMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const current = get();
    const pending = [...current.messages, userMsg];
    set({ messages: pending, sending: true });
    const update = await proposeNextStep(current.threadId, pending);
    const assistantMsg: OnboardingMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: update.message,
    };
    set((s) => ({
      messages: [...s.messages, assistantMsg],
      sending: false,
      suggestion: update.milestone,
    }));
  },
  lockStep: async () => {
    const { suggestion, draft } = get();
    if (!suggestion) return;
    const nextDraft: RoadmapDraft = {
      ...draft,
      milestones: [...draft.milestones, suggestion],
    };
    set({ draft: nextDraft, hasRoadmap: true, suggestion: null });
    await finalizeMilestone(nextDraft);
  },

  skip: () =>
    set((s) => ({
      hasRoadmap: true,
      draft: {
        id: s.draft.id ?? crypto.randomUUID(),
        title: s.draft.title ?? "My Roadmap",
        milestones: [],
        confidence: 0,
      },
    })),
}));

export default useOnboardingStore;
