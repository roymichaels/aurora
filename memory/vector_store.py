"""Lightweight vector index for memory embeddings.

This module provides a minimal wrapper around ``chromadb`` when available
and falls back to a simple in-memory cosine similarity search.  It exposes a
:class:`VectorStore` with ``add`` and ``query`` methods used by the memory
store.
"""
from __future__ import annotations

import os
import re
from collections import Counter
from typing import Any, Dict, List

try:  # pragma: no cover - optional dependency
    import chromadb
    from chromadb.utils import embedding_functions
except Exception:  # pragma: no cover - chromadb optional
    chromadb = None  # type: ignore


class VectorStore:
    """Persistent vector index for memory snippets.

    Parameters
    ----------
    path:
        Optional directory used for the underlying ``chromadb`` store.  When
        ``chromadb`` is unavailable the store operates purely in memory.
    """

    def __init__(self, path: str | None = None):
        self._use_chroma = False
        self._collection = None
        if chromadb is not None and path is not None:
            try:  # pragma: no cover - thin wrapper around library
                client = chromadb.PersistentClient(path=path)
                embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name="all-MiniLM-L6-v2"
                )
                self._collection = client.get_or_create_collection(
                    "memories", embedding_function=embed_fn
                )
                self._use_chroma = True
            except Exception:  # pragma: no cover - chromadb setup failure
                self._collection = None
                self._use_chroma = False
        if not self._use_chroma:
            self._docs: List[str] = []
            self._ids: List[str] = []
            self._embeddings: List[Counter[str]] = []

    # ------------------------------------------------------------------
    def _embed(self, text: str) -> Counter[str]:
        tokens = re.findall(r"\w+", text.lower())
        return Counter(tokens)

    def _cosine(self, a: Counter[str], b: Counter[str]) -> float:
        dot = sum(a[t] * b.get(t, 0) for t in a)
        if not dot:
            return 0.0
        norm_a = sum(v * v for v in a.values()) ** 0.5
        norm_b = sum(v * v for v in b.values()) ** 0.5
        return dot / (norm_a * norm_b)

    # ------------------------------------------------------------------
    def add(self, doc_id: str, document: str, metadata: Dict[str, Any] | None = None) -> None:
        metadata = metadata or {}
        if self._use_chroma and self._collection is not None:  # pragma: no cover - chromadb path
            self._collection.add(
                documents=[document], ids=[doc_id], metadatas=[metadata]
            )
            return
        self._ids.append(doc_id)
        self._docs.append(document)
        self._embeddings.append(self._embed(document))

    # ------------------------------------------------------------------
    def query(self, text: str, k: int = 5) -> List[str]:
        if self._use_chroma and self._collection is not None:  # pragma: no cover
            result = self._collection.query(query_texts=[text], n_results=k)
            return [i for i in result.get("ids", [[]])[0] if i]
        if not self._docs:
            return []
        qvec = self._embed(text)
        sims = [self._cosine(qvec, vec) for vec in self._embeddings]
        order = sorted(range(len(sims)), key=lambda i: sims[i], reverse=True)
        return [self._ids[i] for i in order[:k] if sims[i] > 0]

    # ------------------------------------------------------------------
    def clear(self) -> None:
        """Remove all stored documents."""
        if self._use_chroma and self._collection is not None:  # pragma: no cover
            self._collection.delete(where={})
            return
        self._docs.clear()
        self._ids.clear()
        self._embeddings.clear()


__all__ = ["VectorStore"]
