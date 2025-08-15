# Voice Input Listening Modes

Aurora supports two listening modes for voice input:

- **`push-to-talk`** – hold a key or button to capture audio.
- **`toggle`** – tap once to start listening and again to stop.

The `listenMode` preference defaults to `push-to-talk` and is persisted in
`localStorage` so the chosen mode survives reloads.  It can be updated via
`useVoiceStore().setListenMode(mode)`.

For backward compatibility, the older `inputMode` field is still available and
mirrors `listenMode`.
