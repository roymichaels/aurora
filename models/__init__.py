"""Utility functions for working with packaged local models.

The real model files are downloaded or unpacked on first run and then
cached for subsequent use.  This module provides a light‑weight cache so
other parts of the application can retrieve the paths to these models.
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict

MODELS_DIR = Path(__file__).resolve().parent
_LLM = MODELS_DIR / "llm.bin"
_STT = MODELS_DIR / "stt.bin"
_TTS = MODELS_DIR / "tts.bin"

_CACHE: Dict[str, bytes] = {}
_preloaded = False


def _ensure_placeholder(path: Path) -> None:
    """Create an empty placeholder file if ``path`` does not exist."""
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"")


def preload() -> None:
    """Load model files into an in‑memory cache on first use."""
    global _preloaded
    if _preloaded:
        return

    for name, path in ("llm", _LLM), ("stt", _STT), ("tts", _TTS):
        _ensure_placeholder(path)
        try:
            _CACHE[name] = path.read_bytes()
        except OSError:
            _CACHE[name] = b""
    _preloaded = True


def get_model_bytes(name: str) -> bytes:
    """Return cached bytes for ``name``; triggers preload if necessary."""
    if not _preloaded:
        preload()
    return _CACHE.get(name, b"")

# Preload at import so first run populates the cache
preload()
