import { authorize, extractTokenFromHash, getToken, storeToken, OAuthConfig } from './oauth';

const evernoteConfig: OAuthConfig = {
  authEndpoint: 'https://www.evernote.com/oauth',
  clientId: import.meta.env.VITE_EVERNOTE_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_EVERNOTE_REDIRECT || window.location.origin,
  scope: 'basic',
};

const notionConfig: OAuthConfig = {
  authEndpoint: 'https://api.notion.com/v1/oauth/authorize',
  clientId: import.meta.env.VITE_NOTION_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_NOTION_REDIRECT || window.location.origin,
  scope: 'read',
};

export function beginEvernoteOAuth() {
  authorize(evernoteConfig);
}

export function handleEvernoteRedirect() {
  const token = extractTokenFromHash();
  if (token) {
    storeToken('evernote', token);
  }
  return token;
}

export async function fetchEvernoteNotes() {
  const token = getToken('evernote');
  if (!token) throw new Error('No Evernote token');
  const res = await fetch('https://api.evernote.com/v1/notes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notes');
  const data = await res.json();
  return data.notes || [];
}

export function beginNotionOAuth() {
  authorize(notionConfig);
}

export function handleNotionRedirect() {
  const token = extractTokenFromHash();
  if (token) {
    storeToken('notion', token);
  }
  return token;
}

export async function fetchNotionNotes() {
  const token = getToken('notion');
  if (!token) throw new Error('No Notion token');
  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter: { property: 'object', value: 'page' } }),
  });
  if (!res.ok) throw new Error('Failed to fetch notes');
  const data = await res.json();
  return data.results || [];
}
