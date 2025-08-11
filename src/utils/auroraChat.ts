import { supabase } from '@/integrations/supabase/client';
import { loadProfile, UserProfile, summarizeProfile } from '@/data/profile';
import brain from '@/brain/Brain';
import { getFilterName } from '@/brain/filters';
import { localChat } from '@/agent/localModel';
import type { ChatMessage, ChatOptions } from '@/types/chat';

type ModelPreference = 'auto' | 'local' | 'remote';
const MODEL_PREF_KEY = 'settings.modelPreference';

function getModelPreference(): ModelPreference {
  if (typeof window === 'undefined') return 'remote';
  try {
    const raw = localStorage.getItem(MODEL_PREF_KEY);
    return raw ? (JSON.parse(raw) as ModelPreference) : 'auto';
  } catch {
    return 'auto';
  }
}

function isLowBandwidth(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection;
  return conn?.saveData || ['slow-2g', '2g'].includes(conn?.effectiveType);
}

function shouldUseLocal(pref: ModelPreference): boolean {
  if (pref === 'local') return true;
  if (pref === 'remote') return false;
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return offline || isLowBandwidth();
}

function buildSystemMessages(profile: UserProfile | null): ChatMessage[] {
  const systemMessages: ChatMessage[] = [
    { role: 'system', content: brain.cognition.systemPrompt },
  ];

  if (brain.cognition.contextPrompt) {
    systemMessages.push({ role: 'system', content: brain.cognition.contextPrompt });
  }

  systemMessages.push({
    role: 'system',
    content: `Behavior style: ${brain.behavior.style}`,
  });

  const skillPrompt = brain.skills
    .map((s) => `${s.name}: ${s.description}`)
    .join('; ');
  if (skillPrompt) {
    systemMessages.push({
      role: 'system',
      content: `Available skills: ${skillPrompt}`,
    });
  }

  const profileSummary = summarizeProfile(profile);
  if (profileSummary) {
    systemMessages.unshift({
      role: 'system',
      content: `User profile: ${profileSummary}`,
    });
  }

  const filterNames = brain.filters
    .map((f) => getFilterName(f))
    .filter((n): n is string => Boolean(n));
  if (filterNames.length > 0) {
    systemMessages.push({
      role: 'system',
      content: `Applied filters: ${filterNames.join(', ')}`,
    });
  }

  return systemMessages;
}

let cachedProfile: UserProfile | null | undefined;

function getProfile(): UserProfile | null {
  if (cachedProfile !== undefined) return cachedProfile;
  cachedProfile = loadProfile();
  return cachedProfile;
}

export async function auroraChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<{ content: string }> {
  const profile = getProfile();
  const pref = getModelPreference();
  const useLocal = shouldUseLocal(pref);
  const systemMessages = buildSystemMessages(profile);

  if (useLocal) {
    const { content } = await localChat([...systemMessages, ...messages], options);
    let filtered = content;
    for (const filter of brain.filters) filtered = filter(filtered);
    return { content: filtered };
  }

  try {
    const { data, error } = await supabase.functions.invoke<{ content: string }>(
      'aurora-chat',
      {
        body: {
          messages,
          profile,
          ...options,
        },
      },
    );

    if (error) throw error;
    if (!data || typeof data.content !== 'string') {
      throw new Error('Invalid response from aurora-chat');
    }

    return data;
  } catch (e) {
    if (pref !== 'remote') {
      const { content } = await localChat([...systemMessages, ...messages], options);
      let filtered = content;
      for (const filter of brain.filters) filtered = filter(filtered);
      return { content: filtered };
    }
    throw e;
  }
}
