# Voice Module

This package provides speech-to-text (STT) and text-to-speech (TTS) utilities
for the Aurora project.  By default it uses [Whisper](https://github.com/openai/whisper)
for transcription and streams results to the client over WebRTC.

## Listening modes

The frontend supports two listening modes for voice input:

- `push-to-talk` – hold the microphone button to listen (default).
- `toggle` – tap the microphone button to start or stop listening.

The selected mode is persisted in `localStorage` under `aurora.voiceListenMode`
so existing behaviour remains `push-to-talk` unless changed by the user.

## Configuring Whisper Model Size

The STT pipeline loads a Whisper model at import time.  You can adjust the
model size by setting the `WHISPER_MODEL_SIZE` environment variable before
starting the voice server:

```bash
export WHISPER_MODEL_SIZE=small   # tiny, base, small, medium, large
```

Larger models are generally more accurate but require more memory and take
longer to transcribe audio.  Smaller models provide lower latency at the cost
of accuracy.

## Streaming Transcription

`voice/server.py` begins transcribing audio as soon as recording starts and
periodically streams intermediate transcripts back to the browser.  This reduces
perceived delay for the user, but it comes with trade-offs:

- The same audio may be transcribed multiple times, increasing CPU usage.
- Intermediate transcripts can occasionally include partial or misheard phrases
  that are corrected in later updates.

When the recording ends, the final transcript and synthesized reply audio are
sent together over the data channel.
