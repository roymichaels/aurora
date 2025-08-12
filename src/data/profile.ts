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

import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto';

let profileKey: string | null = null;

export function setProfileKey(key: string) {
  profileKey = key;
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === 'undefined' || !profileKey) return;
  try {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = pbkdf2Sync(profileKey, salt, 100000, 32, 'sha256');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([
      cipher.update(JSON.stringify(profile), 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const payload = {
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: data.toString('base64'),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined' || !profileKey) return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as {
      salt: string;
      iv: string;
      tag: string;
      data: string;
    };
    const key = pbkdf2Sync(profileKey, Buffer.from(payload.salt, 'base64'), 100000, 32, 'sha256');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64')),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8')) as UserProfile;
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

