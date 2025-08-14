import type { ChatEvents } from '@/state/types/chatEvents';

export type EventMap = ChatEvents & {
  'nav:view': { id: string; params?: Record<string, string> };
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
