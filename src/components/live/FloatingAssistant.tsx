import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Bot, Minimize2, Mic, Volume2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { Task } from '@/state/task';
import { validateAnswer } from '@/utils/validation';
import { auroraChat } from '@/utils/auroraChat';
import { useAvatarStore } from '@/state/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

export function FloatingAssistant({
  task,
  onUpdated,
}: {
  task: Task | null;
  onUpdated: (desc: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! How can I help you with your current focus? Type "quick start" to set up your profile.',
    },
  ]);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);

  const { user } = useSupabaseAuth();
  const QUICK_START = [
    { key: 'name', prompt: "What's your name?" },
    { key: 'goals', prompt: 'What are your goals?' },
  ] as const;
  const [qsActive, setQsActive] = useState(false);
  const [qsIndex, setQsIndex] = useState(0);
  const [persona, setPersona] = useState<Record<string, string>>({});

  const endRef = useRef<HTMLDivElement | null>(null);
  // Speech recognition may not be available in all browsers
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const loc = useLocation();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec: SpeechRecognition = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = (e.results as any)?.[0]?.[0]?.transcript as string;
      if (transcript) {
        handleSend(transcript);
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;

    if (!qsActive && text.toLowerCase() === 'quick start') {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      };
      setMessages((m) => [
        ...m,
        userMsg,
        { id: crypto.randomUUID(), role: 'assistant', content: QUICK_START[0].prompt },
      ]);
      setInput('');
      setQsActive(true);
      setQsIndex(0);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    if (qsActive) {
      const current = QUICK_START[qsIndex];
      const updated = { ...persona, [current.key]: text };
      setPersona(updated);
      if (user) {
        await supabase.from('profiles').update({ persona: updated }).eq('id', user.id);
      }
      const next = qsIndex + 1;
      if (next < QUICK_START.length) {
        setQsIndex(next);
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: 'assistant', content: QUICK_START[next].prompt },
        ]);
      } else {
        if (user) {
          await supabase
            .from('profiles')
            .update({ onboarded_at: new Date().toISOString() })
            .eq('id', user.id);
        }
        setQsActive(false);
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: 'assistant', content: "Thanks! You're all set." },
        ]);
      }
      return;
    }

    const isValid = validateAnswer(text);
    setSending(true);

    try {
      const history = messages
        .concat(userMsg)
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      const userSummary = history
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ');
      const systemMessages: { role: 'system'; content: string }[] = [
        { role: 'system', content: `Route: ${loc.pathname}` },
      ];
      if (userSummary) {
        systemMessages.push({
          role: 'system',
          content: `Summary of user statements: ${userSummary}. Refer back to these when replying, e.g., "Earlier you mentioned.."`,
        });
      }
      if (task) {
        systemMessages.push({
          role: 'system',
          content: `Task: ${JSON.stringify({
            id: task.id,
            title: task.title,
            description: task.description,
          })}`,
        });
      }
      if (!isValid) {
        systemMessages.push({
          role: 'system',
          content:
            "The user's last message was incomplete or uninformative. Ask a follow-up question to clarify.",
        });
      }
      const { content: replyText, sentiment } = await auroraChat(
        [...systemMessages, ...history],
        { model: 'o4-mini-2025-04-16' }
      );
      useAvatarStore.getState().setSentiment(sentiment);
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyText,
      };
      setMessages((m) => [...m, reply]);
      if (speak && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(replyText);
        window.speechSynthesis.speak(utter);
      }
    } catch (e: unknown) {
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry — I had trouble reaching the assistant.',
      };
      setMessages((m) => [...m, reply]);
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
    } else {
      rec.start();
      setListening(true);
    }
  };

  useEffect(() => {
    // Toggle global spacing class so floating widgets can avoid the drawer
    document.body.classList.toggle('assistant-open', open);
    // Dynamically set CSS vars for FAB/compass spacing
    document.body.style.setProperty('--fab-bottom', open ? '128px' : '96px');
    document.body.style.setProperty(
      '--compass-right',
      open ? '144px' : '112px'
    );
    return () => {
      document.body.classList.remove('assistant-open');
      document.body.style.removeProperty('--fab-bottom');
      document.body.style.removeProperty('--compass-right');
    };
  }, [open]);

  return (
    <>
      {!open && (
        <button
          aria-label="Open assistant chat"
          onClick={() => setOpen(true)}
          className="fixed z-[var(--z-toast)] w-14 h-14 rounded-full glass-panel elev grid place-items-center hover-scale smooth"
          style={{
            right: 'calc(env(safe-area-inset-right) + 12px)',
            bottom:
              'calc(env(safe-area-inset-bottom) + var(--hud-h, 96px) + var(--hud-gap, 12px) + 12px)',
          }}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent
          className="p-0"
          style={{
            zIndex: 'var(--z-modal)',
            bottom:
              'calc(var(--hud-h) + var(--hud-gap) + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <DrawerHeader className="p-3 border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>Assistant</DrawerTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
                  onClick={() => setMinimized((v) => !v)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div
            className="flex flex-col"
            style={{ height: minimized ? '36vh' : '70vh' }}
          >
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted/60 text-foreground rounded-bl-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {m.role === 'assistant' && (
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
              <Button
                size="icon"
                variant={listening ? 'secondary' : 'ghost'}
                onClick={toggleListening}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything…"
                aria-label="Message input"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={speak ? 'secondary' : 'ghost'}
                onClick={() => setSpeak((v) => !v)}
                aria-label={speak ? 'Disable voice output' : 'Enable voice output'}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
