import type { ChatMessage, ChatOptions } from '@/types/chat';

let engine: any;

export async function localChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<{ content: string }> {
  if (typeof window === 'undefined') {
    throw new Error('Local model not available');
  }

  if (!engine) {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    const model = options.model || 'Llama-3.1-8B-Instruct-q4f32_1-MLC';
    engine = await CreateMLCEngine(model);
  }

  const resp = await engine.chat.completions.create({ messages });
  const content = resp?.choices?.[0]?.message?.content ?? '';
  return { content };
}
