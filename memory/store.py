"""Persistent memory store backed by SQLite and a vector index."""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from typing import Any, Dict, List

from .vector_store import VectorStore

DB_PATH = os.path.join(os.path.dirname(__file__), "memory.db")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = conn.cursor()
db_lock = threading.Lock()
cur.execute(
    """
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        metadata TEXT
    )
    """,
)
conn.commit()

vector_store = VectorStore(CHROMA_PATH)


def save_memory(text: str, metadata: Dict[str, Any] | None = None) -> int:
    """Persist ``text`` and optional ``metadata`` and index its embedding."""
    metadata = metadata or {}
    with db_lock:
        cur.execute(
            "INSERT INTO memories (text, metadata) VALUES (?, ?)",
            (text, json.dumps(metadata)),
        )
        mem_id = cur.lastrowid
        conn.commit()
    vector_store.add(str(mem_id), text, metadata)
    return mem_id


def save_plan(
    goal: str,
    steps: List[str],
    external_ids: Dict[str, List[str]] | None = None,
) -> int:
    """Persist a plan in the memory database."""
    text = f"Plan for {goal}: " + " | ".join(steps)
    metadata: Dict[str, Any] = {"tag": "plan", "goal": goal, "steps": steps}
    if external_ids:
        metadata["external_ids"] = external_ids
    return save_memory(text, metadata)


def query_memory(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """Return top ``k`` memories relevant to ``query`` using similarity search."""
    ids = [int(i) for i in vector_store.query(query, k)]
    if not ids:
        return []
    placeholders = ",".join(["?"] * len(ids))
    cur.execute(
        f"SELECT id, text, metadata FROM memories WHERE id IN ({placeholders})",
        ids,
    )
    rows = cur.fetchall()
    output: List[Dict[str, Any]] = []
    for mid, text, meta_json in rows:
        try:
            meta = json.loads(meta_json) if meta_json else {}
        except Exception:
            meta = {}
        output.append({"id": mid, "text": text, "metadata": meta})
    return output


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
        cur.execute(
            "UPDATE memories SET text=?, metadata=? WHERE id=?",
            (text, json.dumps(metadata), mem_id),
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
