import { create } from "zustand";

export type Dimension = "ethereal" | "alienTemple" | "cyberJungle";

interface ThemeState {
  dimension: Dimension;
  setTheme: (dimension: Dimension) => void;
}

const defaultDimension: Dimension = "ethereal";
if (typeof document !== "undefined") {
  document.documentElement.dataset.dimension = defaultDimension;
}

export const useThemeStore = create<ThemeState>((set) => ({
  dimension: defaultDimension,
  setTheme: (dimension) => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.dimension = dimension;
    }
    set({ dimension });
  },
}));

