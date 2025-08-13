"""Persistent memory store backed by SQLite and a vector index."""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from typing import Any, Dict, Iterable, List

import numpy as np

from .vector_store import VectorStore

DB_PATH = os.path.join(os.path.dirname(__file__), "memory.db")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = conn.cursor()
db_lock = threading.Lock()
# Ensure the backing table exists and has a ``created_at`` column for age filtering
cur.execute(
    """
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        metadata TEXT,
        embedding BLOB,
        created_at REAL DEFAULT (strftime('%s','now'))
    )
    """,
)
conn.commit()

# Backwards compatibility: older databases might lack columns
cur.execute("PRAGMA table_info(memories)")
columns = {row[1] for row in cur.fetchall()}
if "created_at" not in columns:
    cur.execute("ALTER TABLE memories ADD COLUMN created_at REAL DEFAULT (strftime('%s','now'))")
    conn.commit()
if "embedding" not in columns:
    cur.execute("ALTER TABLE memories ADD COLUMN embedding BLOB")
    conn.commit()

vector_store = VectorStore(CHROMA_PATH)


def _to_blob(vec: np.ndarray) -> bytes:
    return vec.astype(np.float32).tobytes()


def _from_blob(blob: bytes | None) -> np.ndarray:
    if not blob:
        return np.array([], dtype=np.float32)
    return np.frombuffer(blob, dtype=np.float32)


def save_memory(text: str, metadata: Dict[str, Any] | None = None) -> int:
    """Persist ``text`` and optional ``metadata`` and index its embedding."""
    metadata = metadata or {}
    emb = vector_store.embed(text)
    with db_lock:
        cur.execute(
            "INSERT INTO memories (text, metadata, embedding) VALUES (?, ?, ?)",
            (text, json.dumps(metadata), _to_blob(emb)),
        )
        mem_id = cur.lastrowid
        conn.commit()
    vector_store.add(str(mem_id), text, metadata)
    return mem_id


def save_plan(
    goal: str,
    steps: List[str],
    external_ids: Dict[str, Dict[str, str]] | None = None,
) -> int:
    """Persist a plan in the memory database.

    ``external_ids`` maps integration names (e.g. ``"calendar"``) to a
    mapping of step text -> external task or event identifiers.  This allows
    later follow-up with the respective services.
    """
    text = f"Plan for {goal}: " + " | ".join(steps)
    metadata: Dict[str, Any] = {"tag": "plan", "goal": goal, "steps": steps}
    if external_ids:
        metadata["external_ids"] = external_ids
    return save_memory(text, metadata)


def save_onboarding(text: str) -> int:
    """Convenience wrapper for onboarding memories."""
    return save_memory(text, {"tag": "onboarding"})


def save_profile(text: str) -> int:
    """Convenience wrapper for profile memories."""
    return save_memory(text, {"tag": "profile"})


def save_insight(text: str) -> int:
    """Convenience wrapper for insight memories."""
    return save_memory(text, {"tag": "insight"})


def query_memory(
    query: str,
    k: int = 5,
    exclude_ids: Iterable[int] | None = None,
    min_age_days: int | None = None,
) -> List[Dict[str, Any]]:
    """Return top ``k`` memories relevant to ``query`` using similarity search.

    Parameters
    ----------
    query:
        Search query.
    k:
        Maximum number of memories to return.
    exclude_ids:
        Iterable of memory IDs that should be skipped.
    min_age_days:
        Minimum age in days for returned memories.  Memories newer than this
        threshold are excluded.
    """

    exclude_ids_set = set(exclude_ids or [])

    qvec = vector_store.embed(query)
    cur.execute("SELECT id, text, metadata, created_at, embedding FROM memories")
    rows = cur.fetchall()
    scored: List[tuple[float, Dict[str, Any]]] = []
    now = time.time()
    for mid, text, meta_json, created_at, emb_blob in rows:
        if mid in exclude_ids_set:
            continue
        if min_age_days is not None and created_at is not None:
            age_days = (now - float(created_at)) / 86400
            if age_days < min_age_days:
                continue
        emb = _from_blob(emb_blob)
        score = vector_store._cosine(qvec, emb)
        if score <= 0:
            continue
        try:
            meta = json.loads(meta_json) if meta_json else {}
        except Exception:
            meta = {}
        scored.append((score, {"id": mid, "text": text, "metadata": meta, "created_at": created_at}))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:k]]


def list_memories() -> List[Dict[str, Any]]:
    """Return all stored memories."""
    with db_lock:
        cur.execute("SELECT id, text, metadata FROM memories")
        rows = cur.fetchall()
    output: List[Dict[str, Any]] = []
    for mid, text, meta_json in rows:
        try:
            meta = json.loads(meta_json) if meta_json else {}
        except Exception:
            meta = {}
        output.append({"id": mid, "text": text, "metadata": meta})
    return output


def update_memory(mem_id: int, text: str, metadata: Dict[str, Any] | None = None) -> bool:
    """Update an existing memory and re-index its embedding."""
    metadata = metadata or {}
    with db_lock:
        cur.execute("SELECT 1 FROM memories WHERE id=?", (mem_id,))
        if not cur.fetchone():
            return False
        emb = vector_store.embed(text)
        cur.execute(
            "UPDATE memories SET text=?, metadata=?, embedding=? WHERE id=?",
            (text, json.dumps(metadata), _to_blob(emb), mem_id),
        )
        conn.commit()
    vector_store.delete(str(mem_id))
    vector_store.add(str(mem_id), text, metadata)
    return True


def delete_memory(mem_id: int) -> bool:
    """Remove a memory and its embedding."""
    with db_lock:
        cur.execute("DELETE FROM memories WHERE id=?", (mem_id,))
        removed = cur.rowcount > 0
        if removed:
            conn.commit()
    if removed:
        vector_store.delete(str(mem_id))
    return removed


if __name__ == "__main__":  # pragma: no cover - convenience CLI
    import sys

    if len(sys.argv) < 2:
        print("{}", end="")
        sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "save":
        text = sys.argv[2] if len(sys.argv) > 2 else ""
        meta = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        save_memory(text, meta)
    elif cmd == "query":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 5
        res = query_memory(query, k)
        print(json.dumps(res))
