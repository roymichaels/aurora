"""Utilities to adjust model output based on the saved persona profile."""
import json
from pathlib import Path
from typing import Any, Dict


def load_persona() -> Dict[str, Any]:
    """Load persona data from ``profile.json`` if it exists."""
    path = Path(__file__).with_name("profile.json")
    if not path.exists():
        return {}
    with path.open() as fh:
        return json.load(fh)


def apply_style(text: str) -> str:
    """Return ``text`` adapted to the saved persona tone and signature phrases."""
    profile = load_persona()
    tone = profile.get("tone")
    phrases = profile.get("signature_phrases", [])

    result = text
    if tone:
        result = f"[{tone}] {result}"

    if phrases:
        prefix = phrases[0]
        suffix = phrases[-1] if len(phrases) > 1 else phrases[0]
        result = f"{prefix} {result} {suffix}"

    return result
