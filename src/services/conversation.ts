import { auroraChatStream } from "@/utils/auroraChat";
import type { ChatMessage } from "@/types/chat";
import { bus } from "@/utils/bus";
import { useAvatarStore } from "@/state/avatar";
import { voiceService } from "@/voice/voiceService";
import {
  memoryStore,
  retrieveRelevantMemories,
} from "@/memory/indexedDbMemory";
import { saveMemory, queryMemory } from "@/memory/store";
import { mergeAndExplainMemories, formatMemoryContext } from "@/memory/relevance";

export type ChatEntry = ChatMessage & { id: string };

export type ConversationSnapshot = {
  messages: ChatEntry[];
  sending: boolean;
  recall: string | null;
};

class ConversationService {
  private state: ConversationSnapshot = { messages: [], sending: false, recall: null };
  private listeners = new Set<(s: ConversationSnapshot) => void>();

  constructor() {
    voiceService.onTranscript((text) => {
      void this.send(text);
    });
  }

  getState(): ConversationSnapshot {
    return this.state;
  }

  subscribe(cb: (s: ConversationSnapshot) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private set(p: Partial<ConversationSnapshot>) {
    this.state = { ...this.state, ...p };
    this.listeners.forEach((cb) => cb(this.state));
  }

  async send(content: string) {
    const text = content.trim();
    if (!text) return;
    const history: ChatMessage[] = this.state.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const userMsg: ChatEntry = { id: crypto.randomUUID(), role: "user", content: text };
    const responseId = crypto.randomUUID();
    this.set({
      messages: [...this.state.messages, userMsg, { id: responseId, role: "assistant", content: "" }],
      sending: true,
    });

    bus.emit("chat/send", { id: userMsg.id, content: text });
    bus.emit("chat/stream:start", { id: responseId });
    bus.emit("sphere/state:set", { state: "thinking" });
    bus.emit("voice/state:set", { state: "thinking" });

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
      this.set({ recall });
      if (recall) {
        setTimeout(() => this.set({ recall: null }), 5000);
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

      let fullText = "";
      let first = true;
      const { sentiment } = await auroraChatStream(payload, { confidence }, (chunk) => {
        fullText += chunk;
        this.set({
          messages: this.state.messages.map((m) =>
            m.id === responseId ? { ...m, content: fullText } : m,
          ),
        });
        bus.emit("chat/stream:chunk", { id: responseId, content: chunk });
        if (first) {
          first = false;
          bus.emit("sphere/state:set", { state: "speaking" });
          bus.emit("voice/state:set", { state: "speaking" });
        }
      });

      useAvatarStore.getState().setSentiment(sentiment);
      bus.emit("chat/stream:end", { id: responseId });
      this.set({ sending: false });
      void voiceService.speak(fullText);
      memoryStore.add("episodic", "assistant", fullText).catch(() => {});
      saveMemory(fullText, { role: "assistant" }).catch(() => {});
    } catch (error) {
      this.set({
        messages: this.state.messages.map((m) =>
          m.id === responseId
            ? { ...m, content: "Sorry, I couldn't respond." }
            : m,
        ),
        sending: false,
      });
      bus.emit("chat/stream:error", { id: responseId, error });
      bus.emit("sphere/state:set", { state: "thinking" });
      bus.emit("voice/state:set", { state: "thinking" });
    }
  }
}

export const conversationService = new ConversationService();
