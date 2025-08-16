# Voice UX

This folder contains hooks and components powering voice interaction.

- `useVoiceMode` manages the current input mode, toggling between push-to-talk and toggle.
- `useVoiceInput` wraps listening controls and now exposes the active mode while emitting `sphere/state:set` events so the `AuroraSphere` can animate "thinking" during backend latency.
- `TTSPill` is a lightweight pill that appears when audio playback is blocked or when the app falls back to a default voice. It pulses to draw attention and plays the pending audio when tapped.

Mount `<TTSPill />` once near the root of the app so it can react to events from `voiceService`.
