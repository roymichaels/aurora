export {};

declare global {
  interface SpeechRecognition {
    lang: string;
    maxAlternatives: number;
    interimResults: boolean;
    onerror: ((event: any) => void) | null;
  }
}

export type WebSpeechRecognition = SpeechRecognition;
