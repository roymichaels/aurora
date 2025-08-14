import { useCallback } from "react";

let focusChatInput = () => {};

export function setChatInputRef(ref: HTMLInputElement | null) {
  // Focus chat input without scrolling the viewport.
  focusChatInput = () => ref?.focus({ preventScroll: true });
}

export function useChatInputFocus() {
  return useCallback(() => {
    focusChatInput();
  }, []);
}

