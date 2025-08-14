import { useCallback } from "react";

let focusChatInput = () => {};

export function setChatInputRef(ref: HTMLInputElement | null) {
  focusChatInput = () => {
    ref?.focus();
  };
}

export function useChatInputFocus() {
  return useCallback(() => {
    focusChatInput();
  }, []);
}

