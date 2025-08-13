import { toast } from "@/hooks/use-toast";

let shown = false;

export function ttsAutoplayToast() {
  if (shown) return;
  shown = true;
  toast({
    description: "Tap to play my response.",
  });
}
