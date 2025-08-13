import { toast } from "@/hooks/use-toast";

let shown = false;

export function ttsFallbackToast() {
  if (shown) return;
  shown = true;
  toast({
    description: "Using a default voice for now. You can retry cloning in Settings → Voice.",
  });
}
