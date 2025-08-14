import { create } from "zustand";
import { auroraChatStream } from "@/utils/auroraChat";
import type { ChatMessage } from "@/types/chat";
import { useAvatarStore } from "@/state/avatar";
import { VoiceIO } from "@/voice/voiceio";
import {
  memoryStore,
  retrieveRelevantMemories,
} from "@/memory/indexedDbMemory";
import { saveMemory, queryMemory } from "@/memory/store";
import { bus } from "@/utils/bus";

export type ChatEntry = ChatMessage & { id: string };

type ChatState = {
  messages: ChatEntry[];
  sending: boolean;
  recall: string | null;
  send: (content: string) => Promise<void>;
};

const voice = typeof window !== "undefined" ? new VoiceIO() : null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sending: false,
  recall: null,
  async send(content: string) {
    const text = content.trim();
    if (!text) return;
    const history: ChatMessage[] = get().messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg: ChatEntry = { id: crypto.randomUUID(), role: "user", content: text };
    set(state => ({ messages: [...state.messages, userMsg], sending: true }));

    bus.emit('chat/stream:start', undefined);
    bus.emit('sphere/state:set', { state: 'thinking' });
    bus.emit('voice/state:set', { state: 'thinking' });

    try {
      memoryStore.add("episodic", "user", text).catch(() => {});
      saveMemory(text, { role: "user" }).catch(() => {});
      const [memories, longTerm] = await Promise.all([
        retrieveRelevantMemories(text),
        queryMemory(text, 5),
      ]);
      const top = [
        ...memories.map(m => m.content),
        ...longTerm.map(m => m.text),
      ];
      if (import.meta.env.DEV) {
        console.debug("Brain retrieval", top.slice(0, 5));
      }
      set({ recall: top.length ? "Why I recalled this" : null });
      if (top.length) {
        setTimeout(() => set({ recall: null }), 5000);
      }
      const memoryContext = [
        ...memories.map(m => `${m.role}: ${m.content}`),
        ...longTerm.map(m => `${m.metadata?.role ?? 'memory'}: ${m.text}`),
      ].join("\n");
      const confidence = memories.length + longTerm.length > 2 ? 0.9 : 0.5;
      const payload: ChatMessage[] = [
        ...history,
        ...(memoryContext
          ? [{ role: "system", content: `Relevant memories:\n${memoryContext}` }]
          : []),
        { role: "user", content: text },
      ];

      const id = crypto.randomUUID();
      set(state => ({ messages: [...state.messages, { id, role: 'assistant', content: '' }] }));

      let fullText = '';
      let first = true;
      const { sentiment } = await auroraChatStream(payload, { confidence }, chunk => {
        fullText += chunk;
        set(state => ({
          messages: state.messages.map(m => m.id === id ? { ...m, content: fullText } : m),
        }));
        bus.emit('chat/stream:chunk', { content: chunk });
        if (first) {
          first = false;
          bus.emit('sphere/state:set', { state: 'speaking' });
          bus.emit('voice/state:set', { state: 'speaking' });
        }
      });

      useAvatarStore.getState().setSentiment(sentiment);
      bus.emit('chat/stream:end', undefined);
      bus.emit('sphere/state:set', { state: 'idle' });
      bus.emit('voice/state:set', { state: 'idle' });
      set({ sending: false });
      voice?.speak(fullText);
      memoryStore.add("episodic", "assistant", fullText).catch(() => {});
      saveMemory(fullText, { role: "assistant" }).catch(() => {});
    } catch (error) {
      const err: ChatEntry = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I couldn't respond.",
      };
      set(state => ({ messages: [...state.messages, err], sending: false }));
      bus.emit('chat/stream:error', { error });
      bus.emit('sphere/state:set', { state: 'idle' });
      bus.emit('voice/state:set', { state: 'idle' });
    }
  },
}));

