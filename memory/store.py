"""Persistent memory store backed by SQLite and a vector index."""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import time
from typing import Any, Dict, Iterable, List

from .vector_store import VectorStore

DB_PATH = os.path.join(os.path.dirname(__file__), "memory.db")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = conn.cursor()
db_lock = threading.Lock()

# -- Schema setup ---------------------------------------------------------
# Create core tables used by the memory store.  ``memories`` holds the raw
# memory text and associated metadata, ``embeddings`` stores vector
# representations for semantic search, ``summaries`` keeps optional
# condensed versions, and ``meta`` tracks schema metadata such as the
# current version.
cur.executescript(
    """
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        metadata TEXT,
        created_at REAL DEFAULT (strftime('%s','now')),
        ts REAL DEFAULT (strftime('%s','now')),
        type TEXT,
        hash TEXT
    );

    CREATE TABLE IF NOT EXISTS embeddings (
        memory_id INTEGER PRIMARY KEY,
        embedding BLOB,
        FOREIGN KEY(memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS summaries (
        memory_id INTEGER PRIMARY KEY,
        summary TEXT,
        FOREIGN KEY(memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """
)
conn.commit()

# Backwards compatibility: older databases might lack newer columns
cur.execute("PRAGMA table_info(memories)")
columns = {row[1] for row in cur.fetchall()}
if "created_at" not in columns:
    cur.execute(
        "ALTER TABLE memories ADD COLUMN created_at REAL DEFAULT (strftime('%s','now'))"
    )
if "ts" not in columns:
    cur.execute("ALTER TABLE memories ADD COLUMN ts REAL DEFAULT (strftime('%s','now'))")
if "type" not in columns:
    cur.execute("ALTER TABLE memories ADD COLUMN type TEXT")
if "hash" not in columns:
    cur.execute("ALTER TABLE memories ADD COLUMN hash TEXT")
conn.commit()

# Add indexes for efficient lookup and deduplication
cur.execute("CREATE INDEX IF NOT EXISTS idx_memories_ts ON memories(ts DESC)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type)")
cur.execute(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_hash ON memories(hash)"
)
conn.commit()

# Seed schema version information
cur.execute(
    "INSERT OR IGNORE INTO meta(key, value) VALUES ('schema_version', '1')"
)
conn.commit()

vector_store = VectorStore(CHROMA_PATH)

HIGH_VALUE_TAGS = {"onboarding", "profile", "plan"}


def _hash_text(text: str) -> str:
    """Return a stable hash for ``text``."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def save_memory(text: str, metadata: Dict[str, Any] | None = None) -> int:
    """Persist ``text`` and optional ``metadata`` and index its embedding."""
    metadata = metadata or {}
    tag = metadata.get("tag")
    hash_val = None if tag in HIGH_VALUE_TAGS else _hash_text(text)
    with db_lock:
        if hash_val is not None:
            cur.execute("SELECT id FROM memories WHERE hash=?", (hash_val,))
            row = cur.fetchone()
            if row:
                return int(row[0])
        cur.execute(
            "INSERT INTO memories (text, metadata, type, hash) VALUES (?, ?, ?, ?)",
            (text, json.dumps(metadata), tag, hash_val),
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

    k = min(k, 5)
    exclude_ids_set = set(exclude_ids or [])

    cand = vector_store.query(query, k + len(exclude_ids_set))
    scores = {int(i): s for i, s in cand if int(i) not in exclude_ids_set}
    ids = list(scores.keys())
    if not ids:
        return []

    placeholders = ",".join(["?"] * len(ids))
    cur.execute(
        f"SELECT id, text, metadata, created_at FROM memories WHERE id IN ({placeholders})",
        ids,
    )
    rows = cur.fetchall()
    now = time.time()
    results: List[Dict[str, Any]] = []
    for mid, text, meta_json, created_at in rows:
        age_days = (now - float(created_at)) / 86400 if created_at else None
        if min_age_days is not None and age_days is not None and age_days < min_age_days:
            continue
        try:
            meta = json.loads(meta_json) if meta_json else {}
        except Exception:
            meta = {}
        importance = float(meta.get("importance", 1.0))
        recency = 1.0 / (1.0 + (age_days or 0.0))
        relevance = float(scores.get(mid, 0.0))
        score = relevance * recency * importance
        results.append(
            {
                "id": mid,
                "text": text,
                "metadata": meta,
                "created_at": created_at,
                "_score": score,
            }
        )
    results.sort(key=lambda m: m["_score"], reverse=True)
    trimmed = results[:k]
    for r in trimmed:
        r.pop("_score", None)
    return trimmed


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
