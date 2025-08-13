"""Persistent memory store backed by SQLite and a vector index."""

from __future__ import annotations

import hashlib
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

# -- Schema setup ---------------------------------------------------------
cur.executescript(
    """
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        metadata TEXT,
        embedding BLOB,
        created_at REAL DEFAULT (strftime('%s','now')),
        ts REAL DEFAULT (strftime('%s','now')),
        type TEXT,
        hash TEXT,
        compacted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts REAL DEFAULT (strftime('%s','now')),
        scope TEXT,
        text TEXT
    );

    CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """
)
conn.commit()

# Backwards-compat: add missing columns/indexes if upgrading
cur.execute("PRAGMA table_info(memories)")
columns = {row[1] for row in cur.fetchall()}
def _add_col(name: str, ddl: str) -> None:
    if name not in columns:
        cur.execute(f"ALTER TABLE memories ADD COLUMN {ddl}")

_add_col("embedding", "embedding BLOB")
_add_col("created_at", "created_at REAL DEFAULT (strftime('%s','now'))")
_add_col("ts", "ts REAL DEFAULT (strftime('%s','now'))")
_add_col("type", "type TEXT")
_add_col("hash", "hash TEXT")
_add_col("compacted", "compacted INTEGER DEFAULT 0")
conn.commit()

cur.execute("CREATE INDEX IF NOT EXISTS idx_memories_ts ON memories(ts DESC)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type)")
cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_hash ON memories(hash)")
conn.commit()

cur.execute(
    "INSERT OR IGNORE INTO meta(key, value) VALUES ('schema_version', '1')"
)
conn.commit()

vector_store = VectorStore(CHROMA_PATH)

HIGH_VALUE_TAGS = {"onboarding", "profile", "plan"}


def _hash_text(text: str) -> str:
    """Return a stable hash for ``text``."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()

# -- Helpers --------------------------------------------------------------
def _to_blob(vec: np.ndarray) -> bytes:
    return vec.astype(np.float32).tobytes()

def _from_blob(blob: bytes | None) -> np.ndarray:
    if not blob:
        return np.array([], dtype=np.float32)
    return np.frombuffer(blob, dtype=np.float32)

def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

# -- Writes ---------------------------------------------------------------
def save_memory(text: str, metadata: Dict[str, Any] | None = None) -> int:
    """Persist text + metadata, compute embedding, dedupe by hash, keep vector index in sync."""
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
    emb = vector_store.embed(text)
    h = _hash_text(text)

    with db_lock:
        # Deduplicate on exact text hash if already present
        cur.execute("SELECT id FROM memories WHERE hash = ?", (h,))
        row = cur.fetchone()
        if row:
            mem_id = int(row[0])
            # Still refresh metadata/ts if you want; here we leave as-is to avoid churn.
        else:
            cur.execute(
                "INSERT INTO memories (text, metadata, embedding, hash) VALUES (?, ?, ?, ?)",
                (text, json.dumps(metadata), _to_blob(emb), h),
            )
            mem_id = cur.lastrowid
        conn.commit()

    # Keep auxiliary in-memory/chroma index updated (best-effort)
    vector_store.delete(str(mem_id))
    vector_store.add(str(mem_id), text, metadata)
    return int(mem_id)

def save_plan(
    goal: str,
    steps: List[str],
    external_ids: Dict[str, Dict[str, str]] | None = None,
) -> int:
    text = f"Plan for {goal}: " + " | ".join(steps)
    metadata: Dict[str, Any] = {"tag": "plan", "goal": goal, "steps": steps}
    if external_ids:
        metadata["external_ids"] = external_ids
    return save_memory(text, metadata)

def save_onboarding(text: str) -> int:
    return save_memory(text, {"tag": "onboarding"})

def save_profile(text: str) -> int:
    return save_memory(text, {"tag": "profile"})

def save_insight(text: str) -> int:
    return save_memory(text, {"tag": "insight"})

# -- Reads ---------------------------------------------------------------
def query_memory(
    query: str,
    k: int = 5,
    exclude_ids: Iterable[int] | None = None,
    min_age_days: int | None = None,
) -> List[Dict[str, Any]]:
    """Return top-k memories relevant to `query` using cosine similarity over stored embeddings."""
    exclude_ids_set = set(int(i) for i in (exclude_ids or []))

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
    qvec = vector_store.embed(query)

    with db_lock:
        cur.execute("SELECT id, text, metadata, created_at, embedding FROM memories")
        rows = cur.fetchall()

    now = time.time()
    scored: List[tuple[float, Dict[str, Any]]] = []
    for mid, text, meta_json, created_at, emb_blob in rows:
        mid = int(mid)
        if mid in exclude_ids_set:
            continue
        if min_age_days is not None and created_at is not None:
            age_days = (now - float(created_at)) / 86400.0
            if age_days < float(min_age_days):
                continue

        emb = _from_blob(emb_blob)
        score = vector_store._cosine(qvec, emb)
        if score <= 0:
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


        scored.append(
            (score, {"id": mid, "text": text, "metadata": meta, "created_at": created_at})
        )

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[: max(0, int(k))]]

def list_memories() -> List[Dict[str, Any]]:
    with db_lock:
        cur.execute("SELECT id, text, metadata FROM memories")
        rows = cur.fetchall()
    output: List[Dict[str, Any]] = []
    for mid, text, meta_json in rows:
        try:
            meta = json.loads(meta_json) if meta_json else {}
        except Exception:
            meta = {}
        output.append({"id": int(mid), "text": text, "metadata": meta})
    return output

def update_memory(mem_id: int, text: str, metadata: Dict[str, Any] | None = None) -> bool:
    """Update an existing memory, recompute embedding, and refresh vector index."""
    metadata = metadata or {}
    emb = vector_store.embed(text)
    with db_lock:
        cur.execute("SELECT 1 FROM memories WHERE id=?", (mem_id,))
        if not cur.fetchone():
            return False
        cur.execute(
            "UPDATE memories SET text=?, metadata=?, embedding=?, ts=(strftime('%s','now')) WHERE id=?",
            (text, json.dumps(metadata), _to_blob(emb), mem_id),
        )
        conn.commit()

    vector_store.delete(str(mem_id))
    vector_store.add(str(mem_id), text, metadata)
    return True

def delete_memory(mem_id: int) -> bool:
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
        raise SystemExit(0)

    cmd = sys.argv[1]
    if cmd == "save":
        text = sys.argv[2] if len(sys.argv) > 2 else ""
        meta = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        mem_id = save_memory(text, meta)
        print(json.dumps({"id": mem_id}))
    elif cmd == "query":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 5
        res = query_memory(query, k)
        print(json.dumps(res))
