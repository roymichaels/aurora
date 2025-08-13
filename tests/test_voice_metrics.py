"""Tests for voice conversation metrics."""

import importlib
import importlib.util
import sys
import types
import time
from pathlib import Path
from typing import Any

import numpy as np

from core.brain import BrainAgent
from core.metrics import metrics


def test_voice_message_counts_single_conversation() -> None:
    """Processing a single voice message increments conversation count once."""
    metrics.conversations = 0

    brain = BrainAgent(persona_store=lambda: "", memory_store=lambda _msg: [])
    brain.process("hello there")

    assert metrics.conversations == 1


def test_first_synthesis_warm_start(monkeypatch: Any) -> None:
    """Warm TTS model avoids delay on the first synthesis."""

    fake_time = {"value": 0.0}

    def fake_monotonic() -> float:
        return fake_time["value"]

    def fake_sleep(secs: float) -> None:
        fake_time["value"] += secs

    monkeypatch.setattr(time, "monotonic", fake_monotonic)
    monkeypatch.setattr(time, "sleep", fake_sleep)

    class DummyTTS:
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover - boilerplate
            fake_sleep(5)
            self.synthesizer = types.SimpleNamespace(output_sample_rate=16000)

        def tts(self, _text: str, speaker_wav: str | None = None) -> np.ndarray:
            return np.zeros(10, dtype=np.float32)

    def dummy_write(buf: Any, _data: Any, samplerate: int, format: str = "WAV") -> None:  # pragma: no cover - simple stub
        buf.write(b"FAKE")

    monkeypatch.setitem(
        sys.modules,
        "TTS.api",
        types.SimpleNamespace(TTS=DummyTTS),
    )
    monkeypatch.setitem(sys.modules, "soundfile", types.SimpleNamespace(write=dummy_write))

    pkg = types.ModuleType("voice")
    pkg.__path__ = [str(Path("voice"))]
    sys.modules["voice"] = pkg

    spec = importlib.util.spec_from_file_location("voice.tts", Path("voice/tts.py"))
    tts_module = importlib.util.module_from_spec(spec)
    sys.modules["voice.tts"] = tts_module
    assert spec.loader is not None  # for mypy
    spec.loader.exec_module(tts_module)
    warm_time = fake_time["value"]

    start = time.monotonic()
    tts_module.synthesize_reply("hello")
    duration = time.monotonic() - start

    assert warm_time == 5
    assert duration == 0
