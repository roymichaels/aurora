"""Tests for fallback routing when no specialized agent handles the message."""

from core.brain import BrainAgent


def test_user_message_appended_when_routed(monkeypatch):
    """Router should receive persona, memories, and the latest user message."""
    captured: dict[str, str] = {}

    brain = BrainAgent(
        persona_store=lambda: "persona",
        memory_store=lambda _msg: ["memory"],
        agents=[],
    )

    def fake_route(prompt: str) -> str:
        captured["prompt"] = prompt
        return "router-response"

    monkeypatch.setattr(brain.router, "route", fake_route)

    result = brain.process("hello")

    expected = (
        "You are the idealized version of the user.\n"
        "Persona: persona\n"
        "Relevant memories:\n"
        "memory\n"
        "\n"
        "User message:\n"
        "hello"
    )
    assert captured["prompt"] == expected
    assert result == "router-response"
