import { create } from "zustand";
import { auroraChat } from "@/utils/auroraChat";
import type { ChatMessage } from "@/types/chat";
import { useAvatarStore } from "@/state/avatar";

export type ChatEntry = ChatMessage & { id: string };

interface ChatState {
  messages: ChatEntry[];
  sending: boolean;
  send: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sending: false,
  send: async (content: string) => {
    const text = content.trim();
    if (!text) return;
    const history: ChatMessage[] = get().messages.map((m) => ({ role: m.role, content: m.content }));
    const userMsg: ChatEntry = { id: crypto.randomUUID(), role: "user", content: text };
    set((s) => ({ messages: [...s.messages, userMsg], sending: true }));
    try {
      const { content: replyText, sentiment } = await auroraChat([...history, { role: "user", content: text }]);
      useAvatarStore.getState().setSentiment(sentiment);
      const reply: ChatEntry = { id: crypto.randomUUID(), role: "assistant", content: replyText };
      set((s) => ({ messages: [...s.messages, reply], sending: false }));
    } catch {
      const err: ChatEntry = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't respond.",
      };
      set((s) => ({ messages: [...s.messages, err], sending: false }));
    }
  },
}));
