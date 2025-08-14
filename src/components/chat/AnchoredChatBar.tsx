import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2 } from "lucide-react";
import { useChat } from "@/state/chat";
import { useTextToSpeech } from "@/voice/useTextToSpeech";
import { EvolvingSphere } from "@/components/effects/EvolvingSphere";
import { setChatInputRef } from "@/hooks/useChatInputFocus";

export function AnchoredChatBar() {
  const { send, sending, messages, recall } = useChat();
  const { speak, blocked, resume } = useTextToSpeech();

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pressStartRef = useRef<number | null>(null);

  useEffect(() => {
    const ref = inputRef.current;
    setChatInputRef(ref);
    ref?.focus();
    return () => setChatInputRef(null);
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
    return () => {
      rec.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec || listening) return;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.stop();
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  const handlePressStart = () => {
    pressStartRef.current = Date.now();
    startListening();
  };

  const handlePressEnd = () => {
    stopListening();
  };

  const handleMicClick = () => {
    if (pressStartRef.current) {
      const duration = Date.now() - pressStartRef.current;
      pressStartRef.current = null;
      if (duration > 300) return;
    }
    toggleListening();
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
          onMouseDown={handlePressStart}
          onTouchStart={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchEnd={handlePressEnd}
          onClick={handleMicClick}
          aria-pressed={listening}
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
      <div
        className={`absolute left-2 transition-all duration-200 ${
          showChips ? "-top-16" : "-top-8"
        } ${recall ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {recall && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full transition-all duration-200">
            {recall}
          </span>
        )}
      </div>
      <div
        className={`flex gap-2 absolute left-2 transition-all duration-200 ${
          showChips
            ? "-top-8 opacity-100"
            : "-top-6 opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={handleConfirm}
          className="action-chip px-3 py-1 text-xs transition-all duration-200"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={handleEdit}
          className="action-chip px-3 py-1 text-xs transition-all duration-200"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
