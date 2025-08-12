"""Basic content moderation filter.

This module provides :func:`filter_output` which scans text for harmful
content using simple keyword checks and, when available, an open-source
moderation model from Hugging Face's ``transformers`` library. If harmful
content is detected, the text is replaced with a gentle warning and the
incident is logged to ``filter.log``.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Iterable

# Configure logger
_LOG_PATH = Path(__file__).with_name("filter.log")
logger = logging.getLogger("aurora.safety")
if not logger.handlers:
    _handler = logging.FileHandler(_LOG_PATH)
    _handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(_handler)
logger.setLevel(logging.INFO)

# Simple keyword list as a fallback moderation mechanism
KEYWORDS: Iterable[str] = {
    "self-harm",
    "suicide",
    "kill myself",
    "murder",
    "hate",
    "violence",
}

# Attempt to load an open-source moderation model if available
try:  # pragma: no cover - optional dependency
    from transformers import pipeline  # type: ignore

    _moderator = pipeline("text-classification", model="unitary/toxic-bert")
except Exception:  # pragma: no cover - runtime failure is acceptable
    _moderator = None

WARNING_MESSAGE = "\u26a0\ufe0f Content removed for safety."


def _is_harmful(text: str) -> bool:
    """Return ``True`` if ``text`` appears harmful."""
    lower = text.lower()
    if any(kw in lower for kw in KEYWORDS):
        return True
    if _moderator is not None:
        try:
            result = _moderator(text, truncation=True)[0]
            label = result.get("label", "").lower()
            score = float(result.get("score", 0))
            if label in {"toxic", "harmful"} and score >= 0.5:
                return True
        except Exception:
            pass
    return False


def filter_output(text: str) -> str:
    """Filter ``text`` returning a safe alternative if necessary."""
    if _is_harmful(text):
        logger.warning("blocked: %s", text.replace("\n", " ")[:200])
        return WARNING_MESSAGE
    return text
