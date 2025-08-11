import { supabase } from '@/integrations/supabase/client';
import { loadProfile, UserProfile } from '@/data/profile';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface AuroraChatOptions {
  model?: string;
}

let cachedProfile: UserProfile | null | undefined;

function getProfile(): UserProfile | null {
  if (cachedProfile !== undefined) return cachedProfile;
  cachedProfile = loadProfile();
  return cachedProfile;
}

export async function auroraChat(
  messages: ChatMessage[],
  options: AuroraChatOptions = {}
): Promise<{ content: string }> {
  const profile = getProfile();
  const { data, error } = await supabase.functions.invoke<{ content: string }>(
    'aurora-chat',
    {
      body: {
        messages,
        profile,
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
