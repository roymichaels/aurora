import type { QuickActionKey } from "./hud.data";
import { addNote, startVoiceNote } from "@/utils/moments";
import { useQuickActionModals } from "@/state/quickActions";

export function useHUDActions() {
  const run = (a: QuickActionKey) => {
    if (a === "addNote") {
      addNote();
      return;
    }
    if (a === "voiceNote") {
      startVoiceNote();
      return;
    }
    if (a === "openTasks") {
      useQuickActionModals.getState().openTasks();
      return;
    }
    const eventMap: Record<string, string> = {
      startFocus: "startFocus",
      startHypnosis: "startHypnosis",
      voiceNote: "voiceNote",
      addNote: "addNote",
      openMap: "openMap",
      openBrowser: "openBrowser",
      openBrain: "openBrain",
      openTasks: "openTasks",
    };
    const name = eventMap[a] ?? a;
    window.dispatchEvent(new CustomEvent("mos", { detail: { type: name } }));
  };
  return { run };
}
