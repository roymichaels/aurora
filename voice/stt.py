"""Speech-to-text utilities using Whisper models."""
from __future__ import annotations

import io
import tempfile
from typing import Optional

try:
    from faster_whisper import WhisperModel
    _MODEL: Optional[WhisperModel] = WhisperModel("base")
    def _run_model(path: str, language: str | None) -> str:
        segments, _ = _MODEL.transcribe(path, language=language)
        return "".join(seg.text for seg in segments).strip()
except Exception:  # pragma: no cover - fallback to openai whisper
    import whisper
    _MODEL = whisper.load_model("base")
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
