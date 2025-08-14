import { createContext, useContext, useState, type ReactNode } from "react";
import { auroraChat } from "@/utils/auroraChat";
import type { ChatMessage } from "@/types/chat";
import { useAvatarStore } from "@/state/avatar";

export type ChatEntry = ChatMessage & { id: string };

interface ChatContextValue {
  messages: ChatEntry[];
  sending: boolean;
  send: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [sending, setSending] = useState(false);

  const send = async (content: string) => {
    const text = content.trim();
    if (!text) return;
    const history: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg: ChatEntry = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const { content: replyText, sentiment } = await auroraChat([...history, { role: "user", content: text }]);
      useAvatarStore.getState().setSentiment(sentiment);
      const reply: ChatEntry = { id: crypto.randomUUID(), role: "assistant", content: replyText };
      setMessages(prev => [...prev, reply]);
    } catch {
      const err: ChatEntry = { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I couldn't respond." };
      setMessages(prev => [...prev, err]);
    } finally {
      setSending(false);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sending, send }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
