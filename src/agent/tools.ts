/* eslint-disable @typescript-eslint/no-explicit-any */
export type ToolName =
  | "get_page_context"
  | "summarize_selection"
  | "clip_note"
  | "start_focus"
  | "start_hypnosis"
  | "block_sites"
  | "fill_form"
  | "copy_to_clipboard"
  | "notify"
  | "schedule_calendar_event"
  | "send_email"
  | "run_automation";

export type Tools = {
  get_page_context: { params: Record<string, never>; result: any };
  summarize_selection: { params: { length?: "short" | "medium" | "long" }; result: { summary: string } };
  clip_note: { params: { text: string; tags?: string[] }; result: { ok: boolean } };
  start_focus: { params: { minutes?: number; hypnosis?: "focus" | "calm" | "confidence" | null }; result: { ok: boolean } };
  start_hypnosis: { params: { mode: "focus" | "calm" | "confidence" | "reset"; duration?: number }; result: { ok: boolean } };
  block_sites: { params: { domains: string[]; minutes?: number }; result: { ok: boolean } };
  fill_form: { params: { text: string }; result: { ok: boolean } };
  copy_to_clipboard: { params: { text: string }; result: { ok: boolean } };
  notify: { params: { title: string; body?: string }; result: { ok: boolean } };
  schedule_calendar_event: { params: { title: string; time: string }; result: { ok: boolean } };
  send_email: { params: { to: string; subject: string; body: string }; result: { ok: boolean } };
  run_automation: { params: { command: string }; result: { ok: boolean } };
};

export const tools = {
  get_page_context: {
    description: "Return URL, title, selection, meta and viewport.",
    parameters: {},
  },
  summarize_selection: {
    description: "Summarize the current selection or full page.",
    parameters: { length: "short|medium|long" },
  },
  clip_note: {
    description: "Save text to Notes with optional tags.",
    parameters: { text: "string", tags: "string[]" },
  },
  start_focus: {
    description: "Start a focus session with optional minutes.",
    parameters: { minutes: "number", hypnosis: "focus|calm|confidence|null" },
  },
  start_hypnosis: {
    description: "Run a hypnosis mode.",
    parameters: { mode: "focus|calm|confidence|reset", duration: "number" },
  },
  block_sites: {
    description: "Temporarily block distracting domains.",
    parameters: { domains: "string[]", minutes: "number" },
  },
  fill_form: {
    description: "Type into the active input/textarea.",
    parameters: { text: "string" },
  },
  copy_to_clipboard: {
    description: "Copy text to clipboard.",
    parameters: { text: "string" },
  },
  notify: {
    description: "Show a HUD toast.",
    parameters: { title: "string", body: "string" },
  },
  schedule_calendar_event: {
    description: "Schedule a calendar event (Pro only).",
    parameters: { title: "string", time: "string" },
  },
  send_email: {
    description: "Send an email (Pro only).",
    parameters: { to: "string", subject: "string", body: "string" },
  },
  run_automation: {
    description: "Run an automation (Pro only).",
    parameters: { command: "string" },
  },
} as const;
