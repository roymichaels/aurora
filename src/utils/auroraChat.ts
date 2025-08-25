import { loadProfile, UserProfile } from '@/data/profile';
import brain from '@/brain/Brain';
import { getFilterName } from '@/brain/filters';
import { routeChat } from '@/agent/router';
import type { ChatMessage, ChatOptions } from '@/types/chat';
import { supabase } from '@/integrations/db';
import { useModelPreference } from '@/state/modelPreference';
import { buildPrompt } from '../../core/prompt.ts';

function buildSystemMessages(profile: UserProfile | null): ChatMessage[] {
  const filterNames = brain.filters
    .map((f) => getFilterName(f))
    .filter((n): n is string => Boolean(n));
  const skills = brain.skills.map((s) => `${s.name}: ${s.description}`);
  const personaFields = profile ? (({ history, ...rest }) => rest)(profile) : {};

  const builtPrompt = buildPrompt(
    personaFields,
    brain.cognition.systemPrompt,
    [],
    brain.behavior.style,
    skills,
    filterNames,
  );

  const systemMessages: ChatMessage[] = [{ role: 'system', content: builtPrompt }];

  if (brain.cognition.contextPrompt) {
    systemMessages.push({ role: 'system', content: brain.cognition.contextPrompt });
  }

  systemMessages.push({
    role: 'system',
    content: 'Respond in 2 to 4 sentences and finish with a question or call to action for the user.'
  });

  return systemMessages;
}

let cachedProfile: UserProfile | null | undefined;

async function getProfile(): Promise<UserProfile | null> {
  if (cachedProfile !== undefined) return cachedProfile;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('persona')
      .single();
    cachedProfile = (data?.persona as UserProfile) ?? loadProfile();
  } catch {
    cachedProfile = loadProfile();
  }
  return cachedProfile;
}

export async function auroraChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<{ content: string; sentiment: number }> {
  const profile = await getProfile();
  const systemMessages = buildSystemMessages(profile);

  const { preference, fallbackToCloud } = useModelPreference.getState();
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const conn =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
      : undefined;
  const lowBandwidth = !!conn && (conn.saveData || ['slow-2g', '2g'].includes(conn.effectiveType || ''));

  let route: 'local' | 'cloud' | undefined;
  if (preference === 'local') route = 'local';
  else if (preference === 'cloud') route = 'cloud';
  else if (offline || lowBandwidth) route = 'local';

  const { content, sentiment } = await routeChat(
    [...systemMessages, ...messages],
    profile,
    { ...options, route, fallbackToCloud },
  );
  let filtered = content;
  for (const filter of brain.filters) filtered = filter(filtered);
  return { content: filtered, sentiment };
}

export async function auroraChatStream(
  messages: ChatMessage[],
  options: ChatOptions = {},
  onChunk: (chunk: string) => void,
): Promise<{ sentiment: number }> {
  const { content, sentiment } = await auroraChat(messages, options);
  onChunk(content);
  return { sentiment };
}
