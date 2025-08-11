import { authorize, extractTokenFromHash, getToken, storeToken, OAuthConfig } from '../oauth';

const config: OAuthConfig = {
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT || window.location.origin,
  scope: 'https://www.googleapis.com/auth/calendar.readonly',
};

export function beginGoogleCalendarOAuth() {
  authorize(config);
}

export function handleGoogleCalendarRedirect() {
  const token = extractTokenFromHash();
  if (token) {
    storeToken('googleCalendar', token);
  }
  return token;
}

export async function fetchGoogleCalendarEvents() {
  const token = getToken('googleCalendar');
  if (!token) throw new Error('No Google Calendar token');
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  return data.items || [];
}
