import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/state/onboarding';
import { useChatStore } from '@/state/chat';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

export function ChatDrawer() {
  const {
    hasRoadmap,
    messages: obMessages,
    sending: obSending,
    lockStep,
    skip,
    suggestion,
  } = useOnboardingStore();
  const { messages: chatMessages, sending: chatSending } = useChatStore();
  const messages = hasRoadmap ? chatMessages : obMessages;
  const sending = hasRoadmap ? chatSending : obSending;

  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight });
    }
  }, [messages, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        aria-label={open ? 'Collapse chat' : 'Expand chat'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn('drawer-grabber', open && 'open')}
      >
        <ChevronUp className="drawer-grabber-icon" />
      </button>
      <div className={cn('chat-drawer glass-maple', open && 'open')}>
        <div ref={contentRef} className="p-4 space-y-2 overflow-y-auto max-h-[70vh]">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'assistant' ? 'justify-start' : 'justify-end')}>
              <div
                className={cn(
                  'rounded-2xl px-3 py-2 text-sm max-w-[80%]',
                  m.role === 'assistant' ? 'glass-panel' : 'bg-primary text-primary-foreground'
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="glass-panel rounded-2xl px-3 py-2 text-sm max-w-[80%]">...</div>
            </div>
          )}
        </div>
        {!hasRoadmap && (
          <div className="flex gap-2 p-4 border-t border-border">
            <Button onClick={lockStep} disabled={!suggestion || sending}>
              Lock step
            </Button>
            <Button variant="ghost" onClick={skip}>
              Skip for now
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatDrawer;
