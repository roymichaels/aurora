import type { QuickActionKey } from "./hud.data";
import { startVoiceNote } from "@/utils/moments";
import { useUIStore } from "@/state/ui";

export function useHUDActions() {
  const run = (a: QuickActionKey) => {
    if (a === "addNote") {
      useUIStore.getState().openModal("journal");
      return;
    }
    if (a === "voiceNote") {
      startVoiceNote();
      return;
    }
    if (a === "openTasks") {
      useUIStore.getState().openModal("tasks");
      return;
    }
    if (a === "openBrain") {
      useUIStore.getState().openModal("brain");
      return;
    }
    if (a === "startFocus") {
      useUIStore.getState().openModal("focus");
      return;
    }
    if (a === "startHypnosis") {
      useUIStore.getState().openModal("hypno");
      return;
    }
    const eventMap: Record<string, string> = {
      openBrowser: "openBrowser",
    };
    const name = eventMap[a] ?? a;
    window.dispatchEvent(new CustomEvent("mos", { detail: { type: name } }));
  };
  return { run };
}
