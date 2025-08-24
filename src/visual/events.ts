export type VisualEventMap = {
  'xp-total-update': { total_xp: number; streak?: number };
};

export type VisualEventType = keyof VisualEventMap;

export function dispatchVisualEvent<K extends VisualEventType>(type: K, detail: VisualEventMap[K]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export function onVisualEvent<K extends VisualEventType>(
  type: K,
  handler: (ev: CustomEvent<VisualEventMap[K]>) => void,
) {
  const listener = handler as EventListener;
  window.addEventListener(type, listener);
  return () => window.removeEventListener(type, listener);
}
