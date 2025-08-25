import { db } from '@/integrations/db';
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
): Promise<{ content: string; sentiment: number }> {
  const tokens = estimateTokens(messages);
  const depth = options.depth ?? 1;
  const chosen = chooseRoute(tokens, depth);
  const route = options.route ?? chosen;

  if (route === 'local') {
    try {
      return await localChat(messages, options);
    } catch (e) {
      if (!options.fallbackToCloud) throw e;
      console.warn('Local model failed, falling back to cloud', e);
    }
  }

  const safeMessages = stripSensitive(messages);
  const safeProfile = sanitizeProfile(profile);
  const { data, error } = await db.functions.invoke<{
    content: string;
    sentiment: number;
  }>('aurora-chat', {
    body: { messages: safeMessages, profile: safeProfile, ...options },
  });
  if (error) throw error;
  if (!data?.content) {
    throw new Error('Empty response from aurora-chat');
  }
  return data;
}
