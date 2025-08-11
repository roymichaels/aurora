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
  history: ProfileHistoryItem[];
}

const FIELD_KEYWORDS: Record<keyof Omit<UserProfile, 'history'>, string> = {
  goals: 'goal',
  values: 'value',
  skills: 'skill',
  habits: 'habit',
  challenges: 'challenge',
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

