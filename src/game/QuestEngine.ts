export const DAILY_QUESTS = [
  { id: 'pick-focus', label: "Pick Today’s Focus" },
  { id: 'start-hypno', label: 'Start 1 Hypno Session' },
  { id: 'add-note', label: 'Add One Note' },
  { id: 'record-voice', label: 'Record Voice Note' },
] as const;

export const REWARDS = { completeQuest: 10, fullClear: 25 } as const;
