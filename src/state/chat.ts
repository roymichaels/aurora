import { create } from "zustand";
import { auroraChatStream } from "@/utils/auroraChat";
import type { ChatMessage } from "@/types/chat";
import { useAvatarStore } from "@/state/avatar";
import { voiceService } from "@/voice/voiceService";
import {
  memoryStore,
  retrieveRelevantMemories,
} from "@/memory/indexedDbMemory";
import { saveMemory, queryMemory } from "@/memory/store";
import { mergeAndExplainMemories, formatMemoryContext } from "@/memory/relevance";
import { bus } from "@/utils/bus";
import { runAgentCommand } from "@/services/aiBridge";

export type ChatEntry = ChatMessage & { id: string };

type ChatState = {
  messages: ChatEntry[];
  sending: boolean;
  recall: string | null;
  send: (content: string) => Promise<void>;
  pushSystem: (content: string) => void;
  pushUser: (content: string) => void;
};

// VoiceService handles TTS internally

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sending: false,
  recall: null,
  pushSystem(content) {
    const msg: ChatEntry = { id: crypto.randomUUID(), role: "system", content };
    set((state) => ({ messages: [...state.messages, msg] }));
  },
  pushUser(content) {
    const msg: ChatEntry = { id: crypto.randomUUID(), role: "user", content };
    set((state) => ({ messages: [...state.messages, msg] }));
  },
  async send(content: string) {
    const text = content.trim();
    if (!text) return;
    const history: ChatMessage[] = get().messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg: ChatEntry = { id: crypto.randomUUID(), role: "user", content: text };
    const responseId = crypto.randomUUID();
    set(state => ({
      messages: [...state.messages, userMsg, { id: responseId, role: 'assistant', content: '' }],
      sending: true,
    }));

    bus.emit('chat/send', { id: userMsg.id, content: text });
    bus.emit('chat/stream:start', { id: responseId });
    bus.emit('sphere/state:set', { state: 'thinking' });
    bus.emit('voice/state:set', { state: 'thinking' });

    try {
      memoryStore.add("episodic", "user", text).catch(() => {});
      saveMemory(text, { role: "user" }).catch(() => {});
      const [memories, longTerm] = await Promise.all([
        retrieveRelevantMemories(text),
        queryMemory(text, 5),
      ]);
      const { annotated, recall } = mergeAndExplainMemories(text, memories, longTerm);
      if (import.meta.env.DEV) {
        console.debug("Brain retrieval", annotated.slice(0, 5));
      }
      set({ recall });
      if (recall) {
        setTimeout(() => set({ recall: null }), 5000);
      }
      const memoryContext = formatMemoryContext(annotated);
      const confidence = annotated.length > 2 ? 0.9 : 0.5;
      const payload: ChatMessage[] = [
        ...history,
        ...(memoryContext
          ? [{ role: "system", content: `Relevant memories:\n${memoryContext}` }]
          : []),
        { role: "user", content: text },
      ];

      let fullText = '';
      let first = true;
      const { sentiment } = await auroraChatStream(payload, { confidence }, chunk => {
        fullText += chunk;
        set(state => ({
          messages: state.messages.map(m => m.id === responseId ? { ...m, content: fullText } : m),
        }));
        bus.emit('chat/stream:chunk', { id: responseId, content: chunk });
        if (first) {
          first = false;
          bus.emit('sphere/state:set', { state: 'speaking' });
          bus.emit('voice/state:set', { state: 'speaking' });
        }
      });

      let finalText = fullText;
      try {
        const parsed = JSON.parse(fullText);
        if (parsed?.content) finalText = parsed.content;
        if (parsed?.tool_call) {
          await runAgentCommand(parsed.tool_call);
        }
      } catch {}

      set(state => ({
        messages: state.messages.map(m =>
          m.id === responseId ? { ...m, content: finalText } : m
        ),
      }));

      useAvatarStore.getState().setSentiment(sentiment);
      bus.emit('chat/stream:end', { id: responseId });
      set({ sending: false });
      void voiceService.speak(finalText);
      memoryStore.add("episodic", "assistant", finalText).catch(() => {});
      saveMemory(finalText, { role: "assistant" }).catch(() => {});
    } catch (error) {
      set(state => ({
        messages: state.messages.map(m =>
          m.id === responseId
            ? { ...m, content: "Sorry, I couldn't respond." }
            : m
        ),
        sending: false,
      }));
      bus.emit('chat/stream:error', { id: responseId, error });
      bus.emit('sphere/state:set', { state: 'thinking' });
      bus.emit('voice/state:set', { state: 'thinking' });
    }
  },
}));

