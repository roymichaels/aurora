
import { create } from "zustand";

export type ModalId =
  | "brain"
  | "journal"
  | "live"
  | "analytics"
  | "tasks"
  | "goals"
  | "settings"
  | "more";

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
    set({
      activeModal: id,
      ...(id === "tasks" ? { tasksRoadmapId: options?.roadmapId ?? null } : {}),
    }),
  closeModal: () => set({ activeModal: null, tasksRoadmapId: null }),
}));

