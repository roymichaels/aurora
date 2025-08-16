import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2 } from "lucide-react";
import { useChatStore } from "@/state/chat";
import { useTextToSpeech } from "@/voice/useTextToSpeech";
import { setChatInputRef } from "@/hooks/useChatInputFocus";
import { useVoiceStore } from "@/state/voice";
import {
  startListening as startBusListening,
  stopListening as stopBusListening,
} from "@/voice/listenHelpers";

export function AnchoredChatBar() {
  const { send, sending, messages, recall } = useChatStore();
  const { speak, blocked, resume } = useTextToSpeech();

  const [input, setInput] = useState("");
  const listening = useVoiceStore((s) => s.isListening);
  const listenMode = useVoiceStore((s) => s.listenMode);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognizingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pressStartRef = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ref = inputRef.current;
    setChatInputRef(ref);
    ref?.focus();
    return () => setChatInputRef(null);
  }, []);

  useEffect(() => {
    // placeholder for any init logic
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty("--chatbar-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
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
        setSuggestion(transcript);
      }
    };
    rec.onstart = () => {
      recognizingRef.current = true;
    };
    rec.onend = () => {
      recognizingRef.current = false;
      stopBusListening();
    };
    recognitionRef.current = rec;
    return () => {
      rec.stop();
      recognitionRef.current = null;
      recognizingRef.current = false;
    };
  }, []);

  const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec || listening || recognizingRef.current) return;
    startBusListening();
    try {
      rec.start();
    } catch (err) {
      if ((err as DOMException)?.name === "InvalidStateError") {
        recognizingRef.current = false;
        stopBusListening();
        try {
          useVoiceStore.getState().setListening(false);
        } catch {
          /* empty */
        }
      }
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.stop();
    stopBusListening();
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [listenMode]);

  const handlePressStart = () => {
    pressStartRef.current = Date.now();
    if (listenMode === 'push-to-talk') startListening();
  };

  const handlePressEnd = () => {
    if (listenMode === 'push-to-talk') stopListening();
  };

  const handleMicClick = () => {
    if (pressStartRef.current) {
      const duration = Date.now() - pressStartRef.current;
      pressStartRef.current = null;
      if (duration > 300) return;
    }
    if (listenMode === 'toggle') {
      if (listening) stopListening();
      else startListening();
    }
  };

  const handleSend = (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    void send(text);
    setInput("");
    setSuggestion(null);
    inputRef.current?.focus();
  };

  const handleConfirm = () => {
    if (suggestion) {
      void handleSend(suggestion);
      setSuggestion(null);
    }
    inputRef.current?.focus();
  };
  const handleEdit = () => {
    if (suggestion) {
      setInput(suggestion);
      setSuggestion(null);
    }
    inputRef.current?.focus();
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const playLast = () => {
    if (lastAssistant) speak(lastAssistant.content);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-x-0 pointer-events-none"
      style={{
        bottom: "var(--kb-offset)",
        zIndex: 70,
      }}
    >
      {/* Visually hidden live region for screen reader announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        key={lastAssistant?.id ?? messages.length}
      >
        {lastAssistant?.content}
      </div>
      <div ref={ref} className="pointer-events-auto relative mx-3 pb-safe-bottom">
      <div className="glass-panel rounded-2xl p-2 elev flex items-center gap-2">

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
          id="anchored-chat-input"
          value={input}
          ref={inputRef}
          onChange={(e) => {
            setInput(e.target.value);
            if (suggestion) setSuggestion(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={suggestion ?? "Need a nudge?"}
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
          suggestion ? "-top-16" : "-top-8"
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
          suggestion
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
  </div>
  );
}
