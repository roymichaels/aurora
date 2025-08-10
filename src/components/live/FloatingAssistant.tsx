
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Bot, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export function FloatingAssistant({ task, onUpdated }: { task: Task | null; onUpdated: (desc: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! How can I help you with your current focus?",
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const history = messages.concat(userMsg).slice(-12).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('aurora-chat', {
        body: {
          model: 'o4-mini-2025-04-16',
          messages: [
            { role: 'system', content: 'You are Aurora, a concise, friendly focus coach. Reply briefly with clear steps.' },
            ...history,
          ],
        },
      });
      if (error) throw error;
      const replyText = (data as any)?.content ?? 'Okay.';
      const reply: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: replyText };
      setMessages((m) => [...m, reply]);
    } catch (e: any) {
      const reply: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry — I had trouble reaching the assistant.' };
      setMessages((m) => [...m, reply]);
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Toggle global spacing class so floating widgets can avoid the drawer
    document.body.classList.toggle('assistant-open', open);
    // Dynamically set CSS vars for FAB/compass spacing
    document.body.style.setProperty('--fab-bottom', open ? '128px' : '96px');
    document.body.style.setProperty('--compass-right', open ? '144px' : '112px');
    return () => {
      document.body.classList.remove('assistant-open');
      document.body.style.removeProperty('--fab-bottom');
      document.body.style.removeProperty('--compass-right');
    };
  }, [open]);

  return (
    <>
      <button
        aria-label="Open assistant chat"
        onClick={() => setOpen(true)}
        className="fixed z-[var(--z-toast)] w-14 h-14 rounded-full glass-panel elev grid place-items-center hover-scale smooth"
        style={{
          right: 'calc(env(safe-area-inset-right) + 12px)',
          bottom: 'calc(env(safe-area-inset-bottom) + var(--hud-h, 96px) + var(--hud-gap, 12px) + 12px)'
        }}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground>
        <DrawerContent
          className="p-0"
          style={{
            zIndex: 'var(--z-modal)',
            bottom: 'calc(var(--hud-h) + var(--hud-gap) + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <DrawerHeader className="p-3 border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>Assistant</DrawerTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label={minimized ? "Expand chat" : "Minimize chat"} onClick={() => setMinimized((v) => !v)}>
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex flex-col" style={{ height: minimized ? "36vh" : "70vh" }}>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/60 text-foreground rounded-bl-sm"
                    }`}>
                      <div className="flex items-start gap-2">
                        {m.role === "assistant" && (
                          <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-background/60 border">
                            <Bot className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] md:max-w-[70%] px-3 py-2 rounded-2xl text-sm bg-muted/60 text-foreground rounded-bl-sm shadow-sm">
                      <span className="opacity-70">Typing…</span>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            {/* Input bar */}
            <div className="p-3 border-t flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything…"
                aria-label="Message input"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending} aria-label="Send message">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
