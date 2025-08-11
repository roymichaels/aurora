import { supabase } from '@/integrations/supabase/client';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface AuroraChatOptions {
  model?: string;
}

export async function auroraChat(
  messages: ChatMessage[],
  options: AuroraChatOptions = {}
): Promise<{ content: string }> {
  const { data, error } = await supabase.functions.invoke<{ content: string }>(
    'aurora-chat',
    {
      body: {
        messages,
        ...options,
      },
    }
  );

  if (error) throw error;
  if (!data || typeof data.content !== 'string') {
    throw new Error('Invalid response from aurora-chat');
  }

  return data;
}
