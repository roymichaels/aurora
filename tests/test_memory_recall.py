"""Tests for the vector-backed memory store and BrainAgent recall."""

from core.brain import BrainAgent
from memory import store as mem


class EchoAgent:
    """Agent that simply echoes the provided context."""

    def can_handle(self, message: str) -> bool:  # pragma: no cover - trivial
        return True

    def handle(self, message: str, context: str) -> str:  # pragma: no cover - trivial
        return context


def _brain() -> BrainAgent:
    return BrainAgent(
        persona_store=lambda: "",
        memory_store=lambda msg: [m["text"] for m in mem.query_memory(msg)],
        agents=[EchoAgent()],
    )


def test_similarity_recall(monkeypatch):
    """The store should return memories relevant to the query."""
    mem.save_memory("My secret hobby is alpine-unicycling")
    mem.save_memory("Completely unrelated fact")

    results = mem.query_memory("alpine-unicycling", k=1)
    assert results and "alpine-unicycling" in results[0]["text"]

    brain = _brain()
    monkeypatch.setattr(brain, "_save_memory_async", lambda text, role: None)
    reply = brain.process("What is my secret hobby?")
    assert "alpine-unicycling" in reply
