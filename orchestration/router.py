"""Utilities for routing prompts between Gemini and ChatGPT LLMs.

The router chooses the most appropriate backend using simple heuristics
based on prompt length, estimated API cost and required reasoning depth.
Obvious personal identifiers are redacted before any cloud call and each
invocation is logged for later optimisation.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Protocol
import socket

from models import preload as preload_models


class Model(Protocol):
    """Callable interface for language models."""

    def __call__(self, prompt: str) -> str:  # pragma: no cover - interface
        """Return a model-generated reply."""


_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_PHONE_RE = re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b")


def abstract_sensitive_data(text: str) -> str:
    """Redact obvious personal identifiers from ``text``.

    This simple heuristic strips out e-mail addresses and US phone
    numbers.  For a production system, a dedicated PII detection service
    should be used instead.
    """

    text = _EMAIL_RE.sub("[REDACTED_EMAIL]", text)
    text = _PHONE_RE.sub("[REDACTED_PHONE]", text)
    return text


def is_online() -> bool:
    """Return ``True`` if basic network connectivity is available."""
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=1.0)
        return True
    except OSError:
        return False


def _metrics():
    """Return metrics object lazily to avoid circular imports."""

    from core.metrics import metrics as _metrics  # type: ignore import-not-found

    return _metrics


@dataclass
class RouterConfig:
    """Configuration controlling routing behaviour."""

    # Route short, inexpensive prompts to Gemini by default
    max_gemini_tokens: int = 128
    gemini_cost_per_token: float = 0.000002

    # ChatGPT is used for longer or deeper prompts when affordable
    chatgpt_cost_per_token: float = 0.000015  # approximate USD
    max_chatgpt_cost: float = 0.01

    # Depth value above which ChatGPT is preferred
    depth_threshold: int = 2


class UsageLogger:
    """Persist usage statistics for optimisation."""

    def __init__(self, path: str = "router_usage.log") -> None:
        self.path = Path(path)

    def log(self, model: str, tokens: int, cost: float) -> None:
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "model": model,
            "tokens": tokens,
            "cost": cost,
        }
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")


class ModelRouter:
    """Route prompts to Gemini or ChatGPT using simple heuristics."""

    def __init__(
        self,
        gemini_model: Model,
        chatgpt_model: Model,
        config: RouterConfig | None = None,
        logger: UsageLogger | None = None,
    ) -> None:
        preload_models()
        self.gemini_model = gemini_model
        self.chatgpt_model = chatgpt_model
        self.config = config or RouterConfig()
        self.logger = logger or UsageLogger()

    def _estimate_tokens(self, text: str) -> int:
        """Return a rough token count for ``text``."""

        return len(text.split())

    def route(self, prompt: str, depth: int = 0) -> str:
        """Send ``prompt`` to the appropriate model.

        Gemini handles short, inexpensive prompts.  ChatGPT is selected
        when the prompt exceeds ``max_gemini_tokens`` or when ``depth`` is
        at least ``depth_threshold`` and the estimated cost remains below
        ``max_chatgpt_cost``.  All prompts have obvious personal data
        abstracted prior to dispatch.  Each call is logged to
        ``router_usage.log``.
        """

        tokens = self._estimate_tokens(prompt)
        gemini_cost = tokens * self.config.gemini_cost_per_token
        chatgpt_cost = tokens * self.config.chatgpt_cost_per_token

        if not is_online():
            response = self.gemini_model(prompt)
            self.logger.log("gemini_offline", tokens, 0.0)
            _metrics().router_local += 1
            return response

        use_chatgpt = (
            (tokens > self.config.max_gemini_tokens or depth >= self.config.depth_threshold)
            and chatgpt_cost <= self.config.max_chatgpt_cost
        )

        sanitized = abstract_sensitive_data(prompt)

        if use_chatgpt:
            response = self.chatgpt_model(sanitized)
            self.logger.log("chatgpt", tokens, chatgpt_cost)
            _metrics().router_cloud += 1
            return response

        response = self.gemini_model(sanitized)
        self.logger.log("gemini", tokens, gemini_cost)
        _metrics().router_local += 1
        return response
