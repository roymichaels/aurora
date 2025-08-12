import os
import json
import sqlite3
from typing import Any, Dict, List

try:
    import chromadb
    from chromadb.utils import embedding_functions
except Exception:  # pragma: no cover - chromadb optional
    chromadb = None

DB_PATH = os.path.join(os.path.dirname(__file__), "memory.db")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute(
    """
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        metadata TEXT
    )
    """
)
conn.commit()

collection = None
if chromadb is not None:
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    collection = client.get_or_create_collection(
        "memories", embedding_function=embed_fn
    )


def save_memory(text: str, metadata: Dict[str, Any] | None = None) -> int:
    metadata = metadata or {}
    cur.execute(
        "INSERT INTO memories (text, metadata) VALUES (?, ?)",
        (text, json.dumps(metadata)),
    )
    mem_id = cur.lastrowid
    conn.commit()
    if collection is not None:
        collection.add(documents=[text], metadatas=[metadata], ids=[str(mem_id)])
    return mem_id


def save_plan(goal: str, steps: List[str]) -> int:
    """Persist a plan in the memory database.

    Parameters
    ----------
    goal:
        Goal the plan addresses.
    steps:
        Ordered list of steps for achieving the goal.

    Returns
    -------
    int
        ID of the stored memory entry.
    """

    text = f"Plan for {goal}: " + " | ".join(steps)
    metadata = {"tag": "plan", "goal": goal, "steps": steps}
    return save_memory(text, metadata)


def query_memory(query: str, k: int = 5) -> List[Dict[str, Any]]:
    if collection is None:
        return []
    results = collection.query(query_texts=[query], n_results=k)
    ids = [int(i) for i in results.get("ids", [[""]])[0] if i]
    if not ids:
        return []
    placeholders = ",".join(["?"] * len(ids))
    cur.execute(
        f"SELECT id, text, metadata FROM memories WHERE id IN ({placeholders})",
        ids,
    )
    rows = cur.fetchall()
    output: List[Dict[str, Any]] = []
    for row in rows:
        mid, text, meta_json = row
        try:
            meta = json.loads(meta_json) if meta_json else {}
        except Exception:
            meta = {}
        output.append({"id": mid, "text": text, "metadata": meta})
    return output


if __name__ == "__main__":
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
