
// [AURORA-BEGIN:visual-events]
export type XpAwardedDetail = {
  activity?: string;
  amount: number;
  total?: number;
};

export function onXpAwarded(handler: (detail: XpAwardedDetail) => void) {
  window.addEventListener("xp-awarded", (e: Event) => {
    const detail = (e as CustomEvent<XpAwardedDetail>).detail;
    handler(detail);
  });
}

export function onStreakProgress(handler: (streak: number) => void) {
  window.addEventListener("streak-progress", (e: Event) => {
    const detail = (e as CustomEvent<{ streak: number }>).detail;
    handler(detail.streak);
  });
}
// [AURORA-END:visual-events]
