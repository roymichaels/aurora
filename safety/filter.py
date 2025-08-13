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
from typing import Iterable, Tuple

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
WARNING_TEMPLATE = WARNING_MESSAGE + " (rule: {rule})."


def request_user_confirmation(text: str, rule: str) -> bool:
    """Ask the user to confirm display of flagged ``text``.

    Returns ``True`` if the user grants consent. Non-interactive environments
    automatically return ``False``. The triggering moderation ``rule`` is
    included in the prompt and log for transparency.
    """

    if not sys.stdin.isatty():
        logger.info(
            "consent skipped (%s, non-interactive): %s",
            rule,
            text.replace("\n", " ")[:200],
        )
        return False

    try:
        decision = input(
            f"\u26a0\ufe0f Potentially harmful content detected ({rule}). View anyway? [y/N]: "
        )
    except Exception:  # pragma: no cover - interactive failure
        logger.exception("consent prompt failed (%s)", rule)
        return False

    accepted = decision.strip().lower() in {"y", "yes"}
    logger.info(
        "consent %s (%s): %s",
        "granted" if accepted else "denied",
        rule,
        text.replace("\n", " ")[:200],
    )
    return accepted


def _is_harmful(text: str, intent: str | None = None) -> Tuple[bool, str | None]:
    """Return ``(is_harmful, rule)`` for ``text``.

    An optional ``intent`` hint may provide additional context such as
    "seeking_help" which can reduce false positives. ``rule`` provides an
    explanation for why the text was flagged.
    """

    lower = text.lower()
    for kw in KEYWORDS:
        if kw in lower:
            helpful_context = {"help", "support", "prevention"}
            if intent and intent.lower() in helpful_context:
                return False, None
            if any(term in lower for term in helpful_context):
                return False, None
            return True, f"keyword '{kw}'"
    if _moderator is not None:
        try:
            result = _moderator(text, truncation=True)[0]
            label = result.get("label", "").lower()
            score = float(result.get("score", 0))
            if label in {"toxic", "harmful"} and score >= 0.5:
                return True, f"moderation model ({label}:{score:.2f})"
        except Exception:
            pass
    return False, None

def filter_output(text: str, *, intent: str | None = None) -> str:
    """Filter ``text`` returning a safe alternative if necessary.

    When harmful content is detected, the user must explicitly consent for the
    content to be returned. Decisions are logged to ``filter.log``.
    """

    harmful, rule = _is_harmful(text, intent=intent)
    if harmful:
        if request_user_confirmation(text, rule or "unknown"):
            return text
        logger.warning("blocked (%s): %s", rule, text.replace("\n", " ")[:200])
        return WARNING_TEMPLATE.format(rule=rule)
    return text
