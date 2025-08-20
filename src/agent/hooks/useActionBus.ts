import { create } from 'zustand';

type Handler<T = any> = (payload: T) => void;

function createEmitter() {
  const map = new Map<string, Set<Handler>>();
  return {
    emit(event: string, payload?: any) {
      const set = map.get(event);
      if (set) {
        for (const fn of Array.from(set)) fn(payload);
      }
    },
    on(event: string, handler: Handler) {
      const set = map.get(event) || new Set<Handler>();
      set.add(handler);
      map.set(event, set);
      return () => {
        set.delete(handler);
        if (!set.size) map.delete(event);
      };
    },
  };
}

const emitter = createEmitter();

export const useActionBus = create(() => emitter);
