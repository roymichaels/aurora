import { useCallback, useEffect, useState } from "react";
import {
  createLightNode,
  LightNode,
  Protocols,
  WakuMessage,
} from "js-waku";

export type WakuChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
};

const CHAT_TOPIC = "/aurora-chat/1/plain";

export function useWakuChat() {
  const [node, setNode] = useState<LightNode | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<WakuChatMessage[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const n = await createLightNode({
          defaultBootstrap: true,
          protocols: [Protocols.LightPush, Protocols.Filter],
        });
        await n.start();
        if (!mounted) {
          await n.stop();
          return;
        }
        setNode(n);
        setReady(true);
        await n.filter.subscribe([CHAT_TOPIC], (msg: WakuMessage) => {
          if (!msg.payload) return;
          try {
            const decoded = new TextDecoder().decode(msg.payload);
            const parsed = JSON.parse(decoded) as {
              role: "user" | "assistant";
              content: string;
            };
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: parsed.role,
                content: parsed.content,
                timestamp: msg.timestamp,
              },
            ]);
          } catch {
            const text = new TextDecoder().decode(msg.payload);
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: text,
                timestamp: msg.timestamp,
              },
            ]);
          }
        });
      } catch (err) {
        console.error("Failed to initialize Waku", err);
      }
    })();
    return () => {
      mounted = false;
      node?.stop().catch(() => {});
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string, role: "user" | "assistant" = "user") => {
      if (!node) return;
      setSending(true);
      try {
        const payload = JSON.stringify({ role, content });
        await node.lightPush.push({
          contentTopic: CHAT_TOPIC,
          payload: new TextEncoder().encode(payload),
        });
      } finally {
        setSending(false);
      }
    },
    [node]
  );

  return { messages, sendMessage, ready, sending };
}

export default useWakuChat;
