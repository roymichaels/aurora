import { create } from 'zustand';

export type ModalId = 'brain' | 'journal' | 'live' | 'analytics' | 'more';

export interface UIState {
  activeModal: ModalId | null;
  openModal: (id: ModalId) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));

