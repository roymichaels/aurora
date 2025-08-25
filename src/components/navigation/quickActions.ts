import { useSyncExternalStore } from "react";

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

const actions: QuickAction[] = [];
const listeners = new Set<() => void>();

export function registerQuickAction(action: QuickAction) {
  actions.push(action);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return actions;
}

export function useQuickActions() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
