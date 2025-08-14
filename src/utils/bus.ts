export type EventMap = {
  'nav:view': { id: string; params?: Record<string, string> };
  'chat/stream:start': void;
  'chat/stream:chunk': { content: string };
  'chat/stream:end': void;
  'chat/stream:error': { error: unknown };
  'sphere/state:set': { state: 'thinking' | 'speaking' | 'idle' };
  'voice/state:set': { state: 'thinking' | 'speaking' | 'idle' };
};

const listeners: { [K in keyof EventMap]?: ((p: EventMap[K]) => void)[] } = {};

export const bus = {
  on<K extends keyof EventMap>(k: K, cb: (p: EventMap[K]) => void) {
    (listeners[k] ||= []).push(cb as any);
    return () => {
      listeners[k] = (listeners[k] || []).filter((f) => f !== (cb as any));
    };
  },
  emit<K extends keyof EventMap>(k: K, p: EventMap[K]) {
    (listeners[k] || []).forEach((f) => f(p as any));
  },
};
