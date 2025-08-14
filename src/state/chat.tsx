import { createContext, useContext, useState, type ReactNode } from "react";
import { auroraChat } from "@/utils/auroraChat";
import type { ChatMessage } from "@/types/chat";
import { useAvatarStore } from "@/state/avatar";
import { useTextToSpeech } from "@/voice/useTextToSpeech";
import { useVoiceStore } from "@/state/voice";
import {
  memoryStore,
  retrieveRelevantMemories,
} from "@/memory/indexedDbMemory";
import { saveMemory, queryMemory } from "@/memory/store";

export type ChatEntry = ChatMessage & { id: string };

interface ChatContextValue {
  messages: ChatEntry[];
  sending: boolean;
  send: (content: string) => Promise<void>;
  recall: string | null;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [recall, setRecall] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  const send = (content: string) => {
    const text = content.trim();
    if (!text) return Promise.resolve();
    const history: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg: ChatEntry = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    window.dispatchEvent(new CustomEvent('voice-processing', { detail: true }));
    useVoiceStore.getState().setThinking(true);
    setSending(true);
    void (async () => {
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
        setRecall(top.length ? "Why I recalled this" : null);
        if (top.length) {
          setTimeout(() => setRecall(null), 5000);
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
        const { content: replyText, sentiment } = await auroraChat(payload, {
          confidence,
        });
        useAvatarStore.getState().setSentiment(sentiment);
        const reply: ChatEntry = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: replyText,
        };
        setMessages(prev => [...prev, reply]);
        void speak(replyText);
        memoryStore.add("episodic", "assistant", replyText).catch(() => {});
        saveMemory(replyText, { role: "assistant" }).catch(() => {});
      } catch {
        const err: ChatEntry = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't respond.",
        };
        setMessages(prev => [...prev, err]);
      } finally {
        setSending(false);
        window.dispatchEvent(new CustomEvent('voice-processing', { detail: false }));
        useVoiceStore.getState().setThinking(false);
      }
    })();
    return Promise.resolve();
  };

  return (
    <ChatContext.Provider value={{ messages, sending, send, recall }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
