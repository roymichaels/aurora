"""Text-to-speech utilities using Coqui TTS."""
from __future__ import annotations

import io
import json
import urllib.request
from typing import Optional

import numpy as np
import soundfile as sf
from TTS.api import TTS

from .config import CONFIG


_TTS: TTS | None = None


def _get_tts(model_path: str | None) -> TTS:
    """Return a cached :class:`TTS` instance.

    Parameters
    ----------
    model_path:
        Optional path to a custom TTS model.  If loading the custom model
        fails, the default model is used instead.
    """
    global _TTS
    if _TTS is None:
        if model_path:
            try:
                _TTS = TTS(model_path=model_path)
            except Exception:
                _TTS = TTS(model_name="tts_models/en/vctk/vits")
        else:
            _TTS = TTS(model_name="tts_models/en/vctk/vits")
    return _TTS


try:
    _get_tts(CONFIG.model_path)
except Exception:
    pass


def _api_synthesize(endpoint: str, text: str, voice_clone: Optional[str]) -> bytes:
    """Call a remote TTS API and return audio bytes."""
    payload = {"text": text}
    if voice_clone:
        payload["voice_clone"] = voice_clone
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read()


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
    cfg = CONFIG

    # Try remote API first if configured
    if cfg.api_endpoint:
        try:
            return _api_synthesize(cfg.api_endpoint, text, voice_clone)
        except Exception:
            pass  # Fall back to local model

    tts = _get_tts(cfg.model_path)
    if voice_clone:
        audio = tts.tts(text, speaker_wav=voice_clone)
    else:
        audio = tts.tts(text)

    audio = np.asarray(audio)
    rms = np.sqrt(np.mean(np.square(audio)))
    if rms > 0:
        audio = audio / rms

    buf = io.BytesIO()
    sf.write(buf, audio, samplerate=tts.synthesizer.output_sample_rate, format="WAV")
    return buf.getvalue()
