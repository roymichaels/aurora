"""Basic content moderation filter.

This module provides :func:`filter_output` which scans text for harmful
content using simple keyword checks and, when available, an open-source
moderation model from Hugging Face's ``transformers`` library. If harmful
content is detected, the text is replaced with a gentle warning and the
incident is logged to ``filter.log``.
"""
from __future__ import annotations

import logging
import sys
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
    "self harm",
    "suicide",
    "kill myself",
    "kill yourself",
    "murder",
    "hate",
    "violence",
    "terrorism",
    "bomb",
    "shoot",
    "abuse",
}

# Attempt to load an open-source moderation model if available
try:  # pragma: no cover - optional dependency
    from transformers import pipeline  # type: ignore

    _moderator = pipeline("text-classification", model="unitary/toxic-bert")
except Exception:  # pragma: no cover - runtime failure is acceptable
    _moderator = None

WARNING_MESSAGE = "\u26a0\ufe0f Content removed for safety."


def request_user_confirmation(text: str) -> bool:
    """Ask the user to confirm display of flagged ``text``.

    Returns ``True`` if the user grants consent. Non-interactive environments
    automatically return ``False``.
    """

    if not sys.stdin.isatty():
        logger.info(
            "consent skipped (non-interactive): %s",
            text.replace("\n", " ")[:200],
        )
        return False

    try:
        decision = input(
            "\u26a0\ufe0f Potentially harmful content detected. View anyway? [y/N]: "
        )
    except Exception:  # pragma: no cover - interactive failure
        logger.exception("consent prompt failed")
        return False

    accepted = decision.strip().lower() in {"y", "yes"}
    logger.info(
        "consent %s: %s",
        "granted" if accepted else "denied",
        text.replace("\n", " ")[:200],
    )
    return accepted


def _is_harmful(text: str, intent: str | None = None) -> bool:
    """Return ``True`` if ``text`` appears harmful.

    An optional ``intent`` hint may provide additional context such as
    "seeking_help" which can reduce false positives.
    """

    lower = text.lower()
    if any(kw in lower for kw in KEYWORDS):
        helpful_context = {"help", "support", "prevention"}
        if intent and intent.lower() in helpful_context:
            return False
        if any(term in lower for term in helpful_context):
            return False
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

def filter_output(text: str, *, intent: str | None = None) -> str:
    """Filter ``text`` returning a safe alternative if necessary.

    When harmful content is detected, the user must explicitly consent for the
    content to be returned. Decisions are logged to ``filter.log``.
    """

    if _is_harmful(text, intent=intent):
        if request_user_confirmation(text):
            return text
        logger.warning("blocked: %s", text.replace("\n", " ")[:200])
        return WARNING_MESSAGE
    return text
