import { VoiceIO } from "@/voice/voiceio";
import { ToolImpl } from "@/agent/tool-impl";
import { validateAnswer } from "@/utils/validation";
import { auroraChat } from "@/utils/auroraChat";

export type AgentEvents = {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onResponse?: (text: string) => void;
  onListeningChange?: (v: boolean) => void;
  onSpeakingChange?: (v: boolean) => void;
  onError?: (e: any) => void;
};

export class AuroraAgent {
  private voice: VoiceIO;
  private listening = false;
  private history: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(private events: AgentEvents = {}) {
    this.voice = new VoiceIO({
      onPartial: (t) => this.events.onPartial?.(t),
      onFinal: (t) => this.onFinalText(t),
      onSpeakingChange: (s) => this.events.onSpeakingChange?.(s),
      onError: (e) => this.events.onError?.(e),
    });
  }

  startPTT() {
    this.listening = true;
    this.events.onListeningChange?.(true);
    this.voice.startPushToTalk();
  }

  stopPTT() {
    this.voice.stopListening();
    this.listening = false;
    this.events.onListeningChange?.(false);
  }

  private async onFinalText(text: string) {
    this.events.onFinal?.(text);
    this.history.push({ role: 'user', content: text });
    if (this.history.length > 20) this.history = this.history.slice(-20);

    const userSummary = this.history
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');

    if (!validateAnswer(text)) {
      try {
        const { content } = await auroraChat([
          {
            role: 'system',
            content: `Recent user statements: ${userSummary}`,
          },
          {
            role: 'system',
            content:
              "The user's response was incomplete or unclear. Ask a follow-up question to clarify.",
          },
          ...this.history,
        ]);
        this.say(content);
      } catch (e) {
        console.error('aurora-chat failed', e);
        this.say('Could you elaborate?');
      }
      return;
    }

    // quick intent guess (optimistic)
    const lower = text.toLowerCase();
    const minutesMatch = /(?:for|in)?\s*(\d{1,2})\s*(?:min|minutes|m)\b/.exec(lower);

    if (/\b(start|begin)\b.*\bfocus\b/.test(lower) || /\bfocus mode\b/.test(lower)) {
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 25;
      await ToolImpl.start_focus({ minutes });
      this.say(`Starting a ${minutes}-minute focus.`);
      return;
    }

    if (/\b(hypnosis|induction|calm|confidence|focus)\b/.test(lower)) {
      const mode = /confidence/.test(lower) ? 'confidence' : /calm/.test(lower) ? 'calm' : 'focus';
      await ToolImpl.start_hypnosis({ mode: mode as any, duration: 60 });
      this.say(`Running a short ${mode} induction.`);
      return;
    }

    if (/\bsummary|summarize\b/.test(lower)) {
      const { summary } = await ToolImpl.summarize_selection({ length: 'short' });
      this.say(summary);
      return;
    }

    try {
      const { content } = await auroraChat([
        {
          role: 'system',
          content: `Recent user statements: ${userSummary}. Use this context and reference earlier user comments when appropriate.`,
        },
        ...this.history,
      ]);
      this.say(content);
    } catch (e) {
      console.error('aurora-chat failed', e);
      this.say('Okay.');
    }
  }

  say(text: string) {
    this.history.push({ role: 'assistant', content: text });
    if (this.history.length > 20) this.history = this.history.slice(-20);
    this.events.onResponse?.(text);
    this.voice.speak(text);
  }
}
