import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2 } from "lucide-react";
import { useChat } from "@/state/chat";
import { useTextToSpeech } from "@/voice/useTextToSpeech";
import { EvolvingSphere } from "@/components/effects/EvolvingSphere";

export function AnchoredChatBar() {
  const { send, sending, messages, recall } = useChat();
  const { speak, blocked, resume } = useTextToSpeech();

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec: SpeechRecognition = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = (e.results as any)?.[0]?.[0]?.transcript as string;
      if (transcript) {
        setInput(transcript);
        setShowChips(true);
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) rec.stop();
    else {
      setListening(true);
      rec.start();
    }
  };

  const handleSend = (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    void send(text);
    setInput("");
    setShowChips(false);
    inputRef.current?.focus();
  };

  const handleConfirm = () => {
    void handleSend();
    inputRef.current?.focus();
  };
  const handleEdit = () => {
    setShowChips(false);
    inputRef.current?.focus();
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const playLast = () => {
    if (lastAssistant) speak(lastAssistant.content);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed left-3 right-3 relative"
      style={{
        bottom: `calc(var(--hud-h) + var(--dock-h) + var(--hud-gap) + var(--kb-offset) + env(safe-area-inset-bottom))`,
        zIndex: "var(--z-hud)",
      }}
    >
      <div className="pointer-events-auto glass-panel rounded-2xl p-2 elev flex items-center gap-2">
        <Button
          size="icon"
          variant={listening ? "secondary" : "ghost"}
          onClick={toggleListening}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
        >
          <Mic className="w-4 h-4" />
        </Button>
        <Input
          value={input}
          ref={inputRef}
          onChange={(e) => {
            setInput(e.target.value);
            if (showChips) setShowChips(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Need a nudge?"
          aria-label="Message input"
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
        {sending && <EvolvingSphere size={24} className="ml-1" />}
        {blocked ? (
          <button
            type="button"
            onClick={() => {
              resume();
              inputRef.current?.focus();
            }}
            className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3" />
            Tap to play
          </button>
        ) : (
          lastAssistant && (
            <button
              type="button"
              onClick={playLast}
              className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              Play
            </button>
          )
        )}
      </div>
      {recall && (
        <div className={`absolute ${showChips ? '-top-16' : '-top-8'} left-2`}>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {recall}
          </span>
        </div>
      )}
      {showChips && (
        <div className="flex gap-2 absolute -top-8 left-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="action-chip px-3 py-1 text-xs"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="action-chip px-3 py-1 text-xs"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
