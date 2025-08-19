import { useUIStore } from "@/state/ui";
import { startVoiceNote } from "@/utils/moments";
import type { ActionId } from "./types";

export function runAction(id: ActionId): void {
  const { openModal } = useUIStore.getState();
  switch (id) {
    case "focus":
      openModal("focus");
      break;
    case "hypno":
      openModal("hypno");
      break;
    case "journal":
      openModal("journal");
      break;
    case "voice":
      void startVoiceNote();
      break;
    default:
      console.warn(`Unknown action: ${id}`);
  }
}

export async function confirmAndRun(id: ActionId, prompt: string): Promise<boolean> {
  const ok = await new Promise<boolean>((resolve) => {
    useUIStore.getState().openModal("confirm", {
      msg: prompt,
      onYes: () => {
        useUIStore.getState().closeModal();
        resolve(true);
      },
      onNo: () => {
        useUIStore.getState().closeModal();
        resolve(false);
      },
    });
  });
  if (ok) {
    runAction(id);
    return true;
  }
  return false;
}
