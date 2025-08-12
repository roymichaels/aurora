import type { ChatMessage, ChatOptions } from '@/types/chat';

let baseEngine: any;
let tunedEngine: any;

const BASE_MODEL = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
const TUNED_MODEL = 'Llama-3.1-8B-Instruct-q4f32_1-MLC-Aurora';

export async function localChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<{ content: string }> {
  if (typeof window === 'undefined') {
    throw new Error('Local model not available');
  }

  const threshold = options.tunedThreshold ?? 0.8;
  const confidence = options.confidence ?? 0;
  let engine;

  if (confidence >= threshold) {
    if (!tunedEngine) {
      try {
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        const model = options.model || TUNED_MODEL;
        tunedEngine = await CreateMLCEngine(model);
      } catch (e) {
        console.warn('Tuned model unavailable, using base model', e);
      }
    }
    engine = tunedEngine;
  }

  if (!engine) {
    if (!baseEngine) {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const model = BASE_MODEL;
      baseEngine = await CreateMLCEngine(model);
    }
    engine = baseEngine;
  }

  const resp = await engine.chat.completions.create({ messages });
  const content = resp?.choices?.[0]?.message?.content ?? '';
  return { content };
}

export function resetLocalEngines() {
  baseEngine = undefined;
  tunedEngine = undefined;
}
