"""Tests for memory hashing, deduplication, and scoring logic."""

import time

from memory import store as mem


def setup_function(_):
    mem.cur.execute("DELETE FROM memories")
    mem.conn.commit()
    mem.vector_store.clear()


def teardown_function(_):
    mem.cur.execute("DELETE FROM memories")
    mem.conn.commit()
    mem.vector_store.clear()


def test_dedupe_by_hash():
    first = mem.save_memory("repeat this")
    second = mem.save_memory("repeat this")
    assert first == second
    mem.cur.execute("SELECT COUNT(*) FROM memories")
    assert mem.cur.fetchone()[0] == 1


def test_high_value_saved_unconditionally():
    first = mem.save_memory("important", {"tag": "plan"})
    second = mem.save_memory("important", {"tag": "plan"})
    assert first != second
    mem.cur.execute("SELECT COUNT(*) FROM memories")
    assert mem.cur.fetchone()[0] == 2


def test_query_scoring_and_limit(monkeypatch):
    ids = []
    now = time.time()
    for i in range(6):
        ids.append(mem.save_memory(f"item {i}", {"importance": i + 1}))
    ages = [10, 8, 6, 4, 2, 0]
    for mid, age in zip(ids, ages):
        mem.cur.execute(
            "UPDATE memories SET created_at=? WHERE id=?",
            (now - age * 86400, mid),
        )
    mem.conn.commit()

    relevance = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]
    monkeypatch.setattr(
        mem.vector_store,
        "query",
        lambda q, k: [(str(ids[i]), relevance[i]) for i in range(len(ids))],
    )

    results = mem.query_memory("item", k=10)
    assert len(results) <= 5

    scores = [
        relevance[i] * (1 / (1 + ages[i])) * (i + 1)
        for i in range(len(ids))
    ]
    expected = ids[scores.index(max(scores))]
    assert results[0]["id"] == expected

