"""Text-to-speech utilities using Coqui TTS."""
from __future__ import annotations

import io
from typing import Optional

import soundfile as sf
from TTS.api import TTS


_TTS: TTS | None = None

def _get_tts() -> TTS:
    global _TTS
    if _TTS is None:
        _TTS = TTS(model_name="tts_models/en/vctk/vits")
    return _TTS


def synthesize_reply(text: str, *, voice_clone: Optional[str] = None) -> bytes:
    """Generate speech audio for ``text``.

    Parameters
    ----------
    text:
        Text to be spoken.
    voice_clone:
        Optional path to a WAV file for voice cloning.

    Returns
    -------
    bytes
        WAV-encoded audio data.
    """
    tts = _get_tts()
    if voice_clone:
        audio = tts.tts(text, speaker_wav=voice_clone)
    else:
        audio = tts.tts(text)
    buf = io.BytesIO()
    sf.write(buf, audio, samplerate=tts.synthesizer.output_sample_rate, format="WAV")
    return buf.getvalue()
