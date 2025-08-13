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


def style_instructions() -> str:
    """Return prompt instructions describing the persona style.

    The instructions encourage the model to reply using the user's preferred
    tone and signature phrases instead of modifying the generated text after
    the fact.
    """

    profile = load_persona()
    tone = profile.get("tone")
    phrases = profile.get("signature_phrases", [])

    parts: list[str] = []
    if tone:
        parts.append(f"Respond in a {tone} tone")
    if phrases:
        joined = ", ".join(phrases)
        parts.append(f"incorporate phrases such as {joined}")

    if not parts:
        return ""

    return " and ".join(parts) + "."


def apply_style(text: str) -> str:
    """Return ``text`` unchanged.

    This legacy helper previously injected tone and signature phrases directly
    into the model output.  The modern approach communicates these preferences
    through prompt instructions, letting the model's own wording carry the
    style.
    """

    return text
