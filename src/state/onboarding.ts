import { create } from "zustand";

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
  send: (text: string) => Promise<void>;
  lockStep: () => void;
  skip: () => void;
}

const initialAssistant = [
  "\uD83D\uDC4B I’m your mentor. Let’s craft your roadmap together. I’ll ask a couple of tiny questions and build the first sprint for you.",
  "First—how are you feeling today, and what’s one thing you want to improve?",
];

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasRoadmap: false,
  threadId: crypto.randomUUID(),
  messages: initialAssistant.map((content) => ({
    id: crypto.randomUUID(),
    role: "assistant" as const,
    content,
  })),
  draft: { milestones: [], confidence: 0 },
  sending: false,
  send: async (text: string) => {
    const userMsg: OnboardingMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    set((s) => ({ messages: [...s.messages, userMsg], sending: true }));
    setTimeout(() => {
      const assistantMsg: OnboardingMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Noted.",
      };
      set((s) => ({ messages: [...s.messages, assistantMsg], sending: false }));
    }, 600);
  },
  lockStep: () =>
    set((s) => ({
      hasRoadmap: true,
      draft: {
        ...s.draft,
        milestones: [
          ...s.draft.milestones,
          { id: crypto.randomUUID(), title: "First step", tasks: [] },
        ],
      },
    })),
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
