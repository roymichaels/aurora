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
        memory_store=lambda msg, exclude_ids=None: [
            m["text"] for m in mem.query_memory(msg, exclude_ids=exclude_ids)
        ],
        agents=[EchoAgent()],
    )


def test_similarity_recall(monkeypatch):
    """The store should return memories relevant to the query."""
    mem.cur.execute("DELETE FROM memories")
    mem.conn.commit()
    mem.vector_store.clear()

    # Insert an unrelated memory first to ensure retrieval is similarity based
    mem.save_memory("Completely unrelated fact")
    mem.save_memory("My secret hobby is alpine-unicycling")

    results = mem.query_memory("alpine-unicycling", k=1)
    assert results and "alpine-unicycling" in results[0]["text"]

    brain = _brain()
    monkeypatch.setattr(brain, "_save_memory_async", lambda text, role: None)
    reply = brain.process("What is my secret hobby?")
    assert "alpine-unicycling" in reply


def test_query_memory_exclude_ids():
    """Memories listed in ``exclude_ids`` should not be returned."""
    mem.cur.execute("DELETE FROM memories")
    mem.conn.commit()
    mem.vector_store.clear()

    mid = mem.save_memory("banana split dessert")
    assert mem.query_memory("banana")[0]["id"] == mid
    assert mem.query_memory("banana", exclude_ids=[mid]) == []


def test_brain_avoids_recent_message_echos(monkeypatch):
    """BrainAgent should exclude IDs from the current conversation."""
    brain = _brain()

    # Make memory saving synchronous for deterministic testing
    monkeypatch.setattr(
        brain,
        "_save_memory_async",
        lambda text, role: brain._recent_memory_ids.append(
            mem.save_memory(text, {"role": role})
        ),
    )

    brain.process("I love unit tests")
    reply = brain.process("What did I just say?")
    assert "I love unit tests" not in reply


def test_brain_avoids_repeating_displayed_memories(monkeypatch):
    """Previously surfaced memories should be excluded from later recalls."""

    mem.cur.execute("DELETE FROM memories")
    mem.conn.commit()
    mem.vector_store.clear()

    mid = mem.save_memory("remember this fact")

    brain = BrainAgent(
        persona_store=lambda: "",
        memory_store=lambda msg, exclude_ids=None: mem.query_memory(msg, exclude_ids=exclude_ids),
        agents=[EchoAgent()],
    )

    # Avoid saving messages during the test to keep _recent_memory_ids clean
    monkeypatch.setattr(brain, "_save_memory_async", lambda text, role: None)

    first = brain.process("remember?")
    assert "remember this fact" in first

    # After being displayed once, the memory ID should now be excluded
    second = brain.process("remember again?")
    assert "remember this fact" not in second
