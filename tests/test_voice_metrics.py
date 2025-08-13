"""Tests for voice conversation metrics."""

from core.brain import BrainAgent
from core.metrics import metrics


def test_voice_message_counts_single_conversation() -> None:
    """Processing a single voice message increments conversation count once."""
    metrics.conversations = 0

    brain = BrainAgent(persona_store=lambda: "", memory_store=lambda _msg, exclude_ids=None: [])
    brain.process("hello there")

    assert metrics.conversations == 1
