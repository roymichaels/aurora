"""Tests for ensuring persona style is applied to BrainAgent responses."""

from core.brain import BrainAgent
from persona import style as persona_style


class DummyAgent:
    """Simple agent that always returns a static response."""

    def can_handle(self, message: str) -> bool:  # pragma: no cover - simple stub
        return True

    def handle(self, message: str, context: str) -> str:  # pragma: no cover - simple stub
        return "base response"


def _make_brain() -> BrainAgent:
    return BrainAgent(persona_store=lambda: "", memory_store=lambda _msg: [], agents=[DummyAgent()])


def test_tone_is_applied(monkeypatch):
    """The tone from the persona profile should prefix the response."""

    monkeypatch.setattr(
        persona_style,
        "load_persona",
        lambda: {"tone": "cheerful", "signature_phrases": []},
    )
    brain = _make_brain()

    result = brain.process("hello")

    assert result == "[cheerful] base response"


def test_signature_phrases_are_applied(monkeypatch):
    """Signature phrases from the persona profile should wrap the response."""

    monkeypatch.setattr(
        persona_style,
        "load_persona",
        lambda: {"tone": "", "signature_phrases": ["yo", "buddy"]},
    )
    brain = _make_brain()

    result = brain.process("hello")

    assert result == "yo base response buddy"

