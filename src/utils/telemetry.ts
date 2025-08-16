export type TelemetryEvent = {
  event: string;
  data?: Record<string, any>;
  ts: number;
};

const queue: TelemetryEvent[] = [];
let timer: number | null = null;
const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const enabled =
  !import.meta.env.DEV &&
  Boolean(endpoint) &&
  import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';

function flush() {
  timer = null;
  if (!queue.length) return;
  const events = queue.splice(0);
  if (!enabled || !endpoint) return; // skip in dev or when disabled
  try {
    const body = JSON.stringify(events);
    if (
      typeof navigator !== 'undefined' &&
      typeof (navigator as any).sendBeacon === 'function'
    ) {
      (navigator as any).sendBeacon(endpoint, body);
    } else if (typeof fetch === 'function') {
      // fire and forget; keepalive allows it to run during unload
      void fetch(endpoint, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => {
          if (!res.ok) {
            // ignore non-OK responses
          }
        })
        .catch(() => {});
    }
  } catch {
    // ignore errors
  }
}

export function track(event: string, data: Record<string, any> = {}): void {
  if (!enabled) return;
  queue.push({ event, data, ts: Date.now() });
  if (timer === null) {
    timer = setTimeout(flush, 1000) as unknown as number;
  }
}
