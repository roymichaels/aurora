"""Speech-to-text utilities using Whisper models."""
from __future__ import annotations

import os
import tempfile
from typing import Optional

# Determine which Whisper model to load.  Smaller models are faster but less
# accurate.  The ``WHISPER_MODEL_SIZE`` environment variable allows overriding
# the default ``"base"`` size when starting the server.
_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "base")

try:
    from faster_whisper import WhisperModel

    _MODEL: Optional[WhisperModel] = WhisperModel(_MODEL_SIZE)

    def _run_model(path: str, language: str | None) -> str:
        segments, _ = _MODEL.transcribe(path, language=language)
        return "".join(seg.text for seg in segments).strip()
except Exception:  # pragma: no cover - fallback to openai whisper
    import whisper

    _MODEL = whisper.load_model(_MODEL_SIZE)

    def _run_model(path: str, language: str | None) -> str:
        result = _MODEL.transcribe(path, language=language)
        return result["text"].strip()


def transcribe_audio(data: bytes, language: str | None = "en") -> str:
    """Transcribe an audio byte stream to text.

    Parameters
    ----------
    data:
        Raw audio bytes encoded in WAV/WebM/MP3 format.
    language:
        Optional language hint for the model.

    Returns
    -------
    str
        The transcribed text.
    """
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        tmp.write(data)
        tmp.flush()
        return _run_model(tmp.name, language)
