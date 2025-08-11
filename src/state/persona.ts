import { create } from "zustand";
import { loadProfile, saveProfile, UserProfile } from "@/data/profile";

interface PersonaState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const usePersonaStore = create<PersonaState>((set) => ({
  profile: loadProfile() ?? { history: [] },
  updateProfile: (updates) =>
    set((state) => {
      const profile = { ...state.profile, ...updates };
      saveProfile(profile);
      return { profile };
    }),
}));
