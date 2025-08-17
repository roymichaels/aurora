
import { create } from "zustand";
import { track } from '@/utils/telemetry';

export type ModalId =
  | "brain"
  | "journal"
  | "live"
  | "analytics"
  | "tasks"
  | "goals"
  | "settings"
  | "more"
  // supplemental panels
  | "focus"
  | "hypno"
  | "notes"
  | "voice"
  | "inventory"
  | "map"
  | "controls"
  | "sphereFull";

type UIState = {
  activeModal: ModalId | null;
  tasksRoadmapId: string | null;
  openModal: (id: ModalId, options?: { roadmapId?: string }) => void;
  closeModal: () => void;
};


export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  tasksRoadmapId: null,
  openModal: (id, options) =>
    set(() => {
      track('ui/modal_open', { id });
      return {
        activeModal: id,
        ...(id === "tasks" ? { tasksRoadmapId: options?.roadmapId ?? null } : {}),
      };
    }),
  closeModal: () =>
    set((s) => {
      track('ui/modal_close', { id: s.activeModal });
      return { activeModal: null, tasksRoadmapId: null };
    }),
}));

