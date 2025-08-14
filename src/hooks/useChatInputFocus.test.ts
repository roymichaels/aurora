/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { setChatInputRef, useChatInputFocus } from "./useChatInputFocus";

describe("useChatInputFocus", () => {
  it("focuses the input immediately", () => {
    const focus = jest.fn();
    const input = { focus } as unknown as HTMLInputElement;
    setChatInputRef(input);
    const { result } = renderHook(() => useChatInputFocus());
    act(() => {
      result.current();
    });
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("does not scroll the viewport when focusing", () => {
    const scrollTo = jest.spyOn(window, "scrollTo");
    const focus = jest.fn((options?: FocusOptions) => {
      if (!options?.preventScroll) {
        window.scrollTo(0, 100);
      }
    });
    const input = { focus } as unknown as HTMLInputElement;
    setChatInputRef(input);
    const { result } = renderHook(() => useChatInputFocus());
    act(() => {
      result.current();
    });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollTo).not.toHaveBeenCalled();
    scrollTo.mockRestore();
  });
});
