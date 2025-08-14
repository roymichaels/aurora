import { useCallback } from "react";

let focusChatInput = () => {};

export function setChatInputRef(ref: HTMLInputElement | null) {
  focusChatInput = () => {
    ref?.focus({ preventScroll: true });
  };
}

export function useChatInputFocus() {
  return useCallback(() => {
    focusChatInput();
  }, []);
}

