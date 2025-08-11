import { loadProfile, UserProfile, summarizeProfile } from '@/data/profile';
import brain from '@/brain/Brain';
import { getFilterName } from '@/brain/filters';
import { routeChat } from '@/agent/router';
import type { ChatMessage, ChatOptions } from '@/types/chat';

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
  const systemMessages = buildSystemMessages(profile);
  const { content } = await routeChat(
    [...systemMessages, ...messages],
    profile,
    options,
  );
  let filtered = content;
  for (const filter of brain.filters) filtered = filter(filtered);
  return { content: filtered };
}
