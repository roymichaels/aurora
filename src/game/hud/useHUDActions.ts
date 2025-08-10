import type { QuickActionKey } from './hud.data'

export function useHUDActions() {
  const run = (a: QuickActionKey) => {
    const eventMap: Record<QuickActionKey, string> = {
      startFocus: 'startFocus',
      startHypnosis: 'startHypnosis',
      voiceNote: 'voiceNote',
      addNote: 'addNote',
      openAnalyze: 'openAnalyze',
      openMap: 'openMap',
    };
    const name = eventMap[a];
    window.dispatchEvent(new CustomEvent('mos', { detail: { type: name } }));
  }
  return { run }
}
