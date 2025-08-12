"""Utilities for routing prompts between local and cloud LLMs.

The router chooses the most cost–effective backend based on prompt
length and estimated API cost.  When a cloud model is used, obvious
personal identifiers are redacted to protect the user's privacy.  Each
call is logged for future optimisation.
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


@dataclass
class RouterConfig:
    """Configuration controlling routing behaviour."""

    max_local_tokens: int = 512
    cloud_cost_per_token: float = 0.000015  # approximate USD
    max_cloud_cost: float = 0.01


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
    """Route prompts to either a local or cloud model."""

    def __init__(
        self,
        local_model: Model,
        cloud_model: Model,
        config: RouterConfig | None = None,
        logger: UsageLogger | None = None,
    ) -> None:
        preload_models()
        self.local_model = local_model
        self.cloud_model = cloud_model
        self.config = config or RouterConfig()
        self.logger = logger or UsageLogger()

    def _estimate_tokens(self, text: str) -> int:
        """Return a rough token count for ``text``."""

        return len(text.split())

    def route(self, prompt: str) -> str:
        """Send ``prompt`` to the appropriate model.

        Prompts longer than ``max_local_tokens`` *and* whose estimated
        cost is within ``max_cloud_cost`` are sent to the cloud model.
        Otherwise the local model is used.  When the cloud model is
        selected, personal data is first abstracted to preserve privacy.
        Usage information for every call is appended to ``router_usage.log``.
        """

        tokens = self._estimate_tokens(prompt)
        cloud_cost = tokens * self.config.cloud_cost_per_token

        if not is_online():
            response = self.local_model(prompt)
            self.logger.log("local_offline", tokens, 0.0)
            return response

        if tokens > self.config.max_local_tokens and cloud_cost <= self.config.max_cloud_cost:
            sanitized = abstract_sensitive_data(prompt)
            response = self.cloud_model(sanitized)
            self.logger.log("cloud", tokens, cloud_cost)
            return response

        response = self.local_model(prompt)
        self.logger.log("local", tokens, 0.0)
        return response
