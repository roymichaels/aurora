"""Lightweight vector index for memory embeddings.

This module provides a minimal wrapper around ``chromadb`` when available
and falls back to a simple in-memory cosine similarity search.  It exposes a
:class:`VectorStore` with ``add`` and ``query`` methods used by the memory
store.
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

import numpy as np

try:  # pragma: no cover - optional dependency
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover - sentence-transformers optional
    SentenceTransformer = None  # type: ignore

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
            self._embeddings: List[np.ndarray] = []
            self._embedder = None
            if SentenceTransformer is not None:  # pragma: no cover - optional
                try:  # pragma: no cover - model download
                    self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
                except Exception:
                    self._embedder = None

    # ------------------------------------------------------------------
    def _basic_embed(self, text: str, dim: int = 256) -> np.ndarray:
        """Fallback embedding when no model is available.

        Uses a simple hashed bag-of-characters approach so cosine similarity
        roughly reflects textual overlap.  This keeps the memory store
        functional in minimal environments and during tests without requiring
        heavy model downloads.
        """

        vec = np.zeros(dim, dtype=np.float32)
        for b in text.encode("utf-8"):
            vec[b % dim] += 1.0
        if np.linalg.norm(vec):
            vec /= np.linalg.norm(vec)
        return vec

    def _embed(self, text: str) -> np.ndarray:
        if self._embedder is not None:
            return np.array(self._embedder.encode(text))
        # Fallback embedding using deterministic hash to avoid heavy deps
        return np.array([float(abs(hash(text)) % 1_000_000)], dtype=float)

    # ------------------------------------------------------------------
    def embed(self, text: str) -> np.ndarray:
        """Public wrapper used by other modules to obtain embeddings."""
        return self._embed(text)

    def _cosine(self, a: np.ndarray, b: np.ndarray) -> float:
        if not a.size or not b.size:
            return 0.0
        denom = np.linalg.norm(a) * np.linalg.norm(b)
        if not denom:
            return 0.0
        return float(np.dot(a, b) / denom)

    # ------------------------------------------------------------------
    def add(
        self, doc_id: str, document: str, metadata: Dict[str, Any] | None = None
    ) -> None:
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
    def query(self, text: str, k: int = 5) -> List[Tuple[str, float]]:
        if self._use_chroma and self._collection is not None:  # pragma: no cover
            result = self._collection.query(query_texts=[text], n_results=k)
            ids = result.get("ids", [[]])[0]
            dists = result.get("distances", [[]])[0]
            scores = [1 / (1 + d) for d in dists] if dists else [1.0] * len(ids)
            return [(i, s) for i, s in zip(ids, scores) if i]
        if not self._docs:
            return []
        qvec = self._embed(text)
        sims = [self._cosine(qvec, vec) for vec in self._embeddings]
        order = sorted(range(len(sims)), key=lambda i: sims[i], reverse=True)
        return [
            (self._ids[i], sims[i])
            for i in order[:k]
            if sims[i] > 0
        ]

    # ------------------------------------------------------------------
    def delete(self, doc_id: str) -> None:
        """Remove a document and its embedding from the store."""
        if self._use_chroma and self._collection is not None:  # pragma: no cover
            self._collection.delete(ids=[doc_id])
            return
        if doc_id in self._ids:
            idx = self._ids.index(doc_id)
            del self._ids[idx]
            del self._docs[idx]
            del self._embeddings[idx]

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
