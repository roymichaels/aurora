export interface ConversationResponse {
  question: string;
  answer: string;
  created_at?: string;
}

export interface ProfileHistoryItem {
  question: string;
  answer: string;
  timestamp: string;
}

export interface UserProfile {
  goals?: string;
  values?: string;
  skills?: string;
  habits?: string;
  challenges?: string;
  tones?: string;
  quirks?: string;
  history: ProfileHistoryItem[];
}

const FIELD_KEYWORDS: Record<keyof Omit<UserProfile, 'history'>, string> = {
  goals: 'goal',
  values: 'value',
  skills: 'skill',
  habits: 'habit',
  challenges: 'challenge',
  tones: 'tone',
  quirks: 'quirk',
};

export function buildHistory(
  responses: ConversationResponse[],
): ProfileHistoryItem[] {
  return responses.map((r) => ({
    question: r.question,
    answer: r.answer,
    timestamp: r.created_at ?? new Date().toISOString(),
  }));
}

export function buildProfile(
  responses: ConversationResponse[],
): UserProfile {
  const profile: UserProfile = { history: buildHistory(responses) };

  for (const r of responses) {
    const q = r.question.toLowerCase();
    for (const [field, keyword] of Object.entries(
      FIELD_KEYWORDS,
    ) as [keyof Omit<UserProfile, 'history'>, string][]) {
      if (q.includes(keyword)) {
        profile[field] = r.answer;
        break;
      }
    }
  }

  return profile;
}

export function buildAnswers(responses: ConversationResponse[]) {
  return responses.map((r) => ({ question: r.question, answer: r.answer }));
}

const PROFILE_STORAGE_KEY = 'aurora_user_profile_v1';

export function saveProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function summarizeProfile(profile: UserProfile | null): string {
  if (!profile) return '';
  const parts: string[] = [];
  if (profile.goals) parts.push(`Goals: ${profile.goals}`);
  if (profile.values) parts.push(`Values: ${profile.values}`);
  if (profile.tones) parts.push(`Tone: ${profile.tones}`);
  if (profile.quirks) parts.push(`Quirks: ${profile.quirks}`);
  return parts.join('; ');
}

