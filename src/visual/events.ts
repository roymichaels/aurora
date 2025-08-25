
// [AURORA-BEGIN:visual-events]
export type XpAwardedDetail = {
  activity?: string;
  amount: number;
  total?: number;
};

type VisualEvents = {
  "xp-awarded": XpAwardedDetail;
  "streak-progress": { streak: number };
  "xp-total-update": { total_xp: number; streak?: number };
};

export function dispatchVisualEvent<K extends keyof VisualEvents>(
  type: K,
  detail: VisualEvents[K],
) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function onVisualEvent<K extends keyof VisualEvents>(
  type: K,
  handler: (event: CustomEvent<VisualEvents[K]>) => void,
) {
  window.addEventListener(type, handler as EventListener);
}

export function onXpAwarded(handler: (detail: XpAwardedDetail) => void) {
  onVisualEvent("xp-awarded", (e) => handler(e.detail));
}

export function onStreakProgress(handler: (streak: number) => void) {
  onVisualEvent("streak-progress", (e) => handler(e.detail.streak));
}
// [AURORA-END:visual-events]
