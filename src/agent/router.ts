import { supabase } from '@/integrations/supabase/client';
import { localChat } from '@/agent/localModel';
import type { ChatMessage, ChatOptions } from '@/types/chat';
import type { UserProfile } from '@/data/profile';

// Simple token estimator: count whitespace-separated words
function estimateTokens(messages: ChatMessage[]): number {
  return messages
    .map((m) => m.content)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

// Strip obvious sensitive data like emails or long numbers
function stripSensitive(messages: ChatMessage[]): ChatMessage[] {
  const emailRegex = /[\w.+-]+@[\w.-]+/g;
  const longNumber = /\b\d{4,}\b/g;
  return messages.map((m) => ({
    ...m,
    content: m.content.replace(emailRegex, '[REDACTED]').replace(longNumber, '[REDACTED]'),
  }));
}

function sanitizeProfile(profile: UserProfile | null): Partial<UserProfile> | null {
  if (!profile) return null;
  const { history, ...rest } = profile;
  return rest;
}

// Decide whether to use local or cloud model
function chooseRoute(tokens: number, depth: number): 'local' | 'cloud' {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (offline) return 'local';
  if (tokens > 200 || depth > 2) return 'cloud';
  return 'local';
}

export async function routeChat(
  messages: ChatMessage[],
  profile: UserProfile | null,
  options: ChatOptions = {},
): Promise<{ content: string }> {
  const tokens = estimateTokens(messages);
  const depth = options.depth ?? 1;
  const route = chooseRoute(tokens, depth);

  if (route === 'local') {
    return localChat(messages, options);
  }

  const safeMessages = stripSensitive(messages);
  const safeProfile = sanitizeProfile(profile);
  const { data, error } = await supabase.functions.invoke<{ content: string }>('aurora-chat', {
    body: { messages: safeMessages, profile: safeProfile, ...options },
  });
  if (error) throw error;
  return data ?? { content: '' };
}
