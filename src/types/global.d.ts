import type { AuroraAgent } from "@/agent/AuroraAgent";

interface SpeechRecognitionEvent extends Event {
  results: any;
  resultIndex: number;
}

interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    __agent?: AuroraAgent;
    __coachAgent?: AuroraAgent;
    chrome?: any;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
    ClipboardItem?: typeof ClipboardItem;
  }
}

export {};
