import type { QuickActionKey } from "./hud.data";
import { addNote, startVoiceNote } from "@/utils/moments";

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
    const eventMap: Record<QuickActionKey, string> = {
      startFocus: "startFocus",
      startHypnosis: "startHypnosis",
      voiceNote: "voiceNote",
      addNote: "addNote",
      openAnalyze: "openAnalyze",
      openMap: "openMap",
      openBrowser: "openBrowser",
    };
    const name = eventMap[a];
    window.dispatchEvent(new CustomEvent("mos", { detail: { type: name } }));
  };
  return { run };
}
