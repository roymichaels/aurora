"""Utilities to adjust model output based on the saved persona profile."""
import json
from pathlib import Path
from typing import Any, Dict


def _load_profile() -> Dict[str, Any]:
    """Load persona data from profile.json if it exists."""
    path = Path(__file__).with_name("profile.json")
    if not path.exists():
        return {}
    with path.open() as fh:
        return json.load(fh)


def apply_style(text: str) -> str:
    """Return ``text`` adapted to the saved persona tone and catchphrases."""
    profile = _load_profile()
    tone = profile.get("tone")
    catchphrases = profile.get("catchphrases", [])

    result = text
    if tone:
        result = f"[{tone}] {result}"

    if catchphrases:
        prefix = catchphrases[0]
        suffix = catchphrases[-1] if len(catchphrases) > 1 else catchphrases[0]
        result = f"{prefix} {result} {suffix}"

    return result
