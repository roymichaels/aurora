export type DataSource = 'googleCalendar' | 'evernote' | 'notion';

const PREFIX = 'consent.';

export function getConsent(source: DataSource): boolean {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + source) || 'false') as boolean;
  } catch {
    return false;
  }
}

export function setConsent(source: DataSource, value: boolean) {
  try {
    localStorage.setItem(PREFIX + source, JSON.stringify(value));
  } catch {}
}
