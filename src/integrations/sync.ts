import { memoryStore } from '@/memory/indexedDbMemory';
import { getConsent } from '@/lib/consent';
import { fetchGoogleCalendarEvents } from './google/calendar';
import { fetchEvernoteNotes, fetchNotionNotes } from './notes';

export async function syncGoogleCalendar() {
  if (!getConsent('googleCalendar')) return;
  const events = await fetchGoogleCalendarEvents();
  for (const ev of events) {
    const summary = ev.summary || 'Untitled event';
    const start = ev.start?.dateTime || ev.start?.date || '';
    const content = `Event: ${summary} @ ${start}`;
    await memoryStore.add('episodic', 'user', content, {
      tags: ['calendar', 'google'],
    });
  }
}

export async function syncEvernote() {
  if (!getConsent('evernote')) return;
  const notes = await fetchEvernoteNotes();
  for (const n of notes) {
    const content = `${n.title ?? 'Untitled'}\n${n.content ?? ''}`;
    await memoryStore.add('semantic', 'user', content, {
      tags: ['note', 'evernote'],
    });
  }
}

export async function syncNotion() {
  if (!getConsent('notion')) return;
  const pages = await fetchNotionNotes();
  for (const p of pages) {
    const title =
      p.properties?.title?.title?.map((t: any) => t.plain_text).join('') || 'Untitled';
    await memoryStore.add('semantic', 'user', title, {
      tags: ['note', 'notion'],
    });
  }
}
