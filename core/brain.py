"""Central Brain agent for orchestrating specialized sub-agents.

This module defines :class:`BrainAgent`, the primary coordinator of the
personal AI Brain system.  It retrieves persona and memory context before
dispatching a user message to a suitable sub-agent.
"""
from __future__ import annotations

import asyncio
import threading
from dataclasses import dataclass, field
from typing import Callable, Iterable, Protocol, Sequence

from agents.coaching import CoachingAgent
from memory.store import save_memory
from persona.style import apply_style
from safety.filter import filter_output
from .logger import get_logger
from .metrics import metrics


class SupportsAgent(Protocol):
    """Protocol each specialized agent must follow."""

    def can_handle(self, message: str) -> bool:
        """Return ``True`` if the agent is able to handle ``message``."""

    def handle(self, message: str, context: str) -> str:
        """Return a response for ``message`` using extra ``context``."""


@dataclass
class BrainAgent:
    """High level orchestrator that delegates work to specialized agents.

    Parameters
    ----------
    persona_store:
        Callable returning a short string describing the user's ideal persona.
    memory_store:
        Callable accepting a message and returning an iterable of memory
        snippets relevant to that message.
    agents:
        Sequence of sub-agents responsible for specific tasks.  Each must
        implement :class:`SupportsAgent`.
    coach:
        Optional :class:`CoachingAgent` that always generates a short
        motivational snippet which is appended to the chosen agent's
        response.
    prompt_template:
        Format string used to build the master prompt.  ``{persona}`` and
        ``{memories}`` placeholders will be replaced prior to dispatch.
    """

    persona_store: Callable[[], str]
    memory_store: Callable[[str], Iterable[str]]
    agents: Sequence[SupportsAgent] = field(default_factory=list)
    coach: CoachingAgent | None = None
    prompt_template: str = (
        "You are the idealized version of the user.\n"
        "Persona: {persona}\n"
        "Relevant memories:\n{memories}\n"
    )

    def _save_memory_async(self, text: str, role: str) -> None:
        """Persist ``text`` with ``role`` metadata without blocking."""
        metadata = {"role": role}
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            threading.Thread(
                target=save_memory, args=(text, metadata), daemon=True
            ).start()
        else:
            loop.run_in_executor(None, save_memory, text, metadata)

    def process(self, message: str, request_id: str | None = None) -> str:
        """Process a user ``message`` by delegating to a sub-agent.

        The method retrieves persona and memory snippets, constructs the
        master prompt, and invokes the first agent capable of handling the
        message.  If no agent accepts the message, the composed prompt is
        returned so callers can decide how to handle it.
        """

        logger = get_logger(__name__)
        metrics.conversations += 1
        logger.info("processing message", extra={"request_id": request_id, "agent": "BrainAgent"})

        persona = self.persona_store() or ""

        try:
            memories = list(self.memory_store(message))
        except Exception:
            metrics.errors += 1
            logger.exception("memory store error", extra={"request_id": request_id, "agent": "memory_store"})
            memories = []
        else:
            metrics.memory_queries += 1

        memory_text = "\n".join(memories)
        context = self.prompt_template.format(persona=persona, memories=memory_text)

        response = None
        for agent in self.agents:
            try:
                if agent.can_handle(message):
                    logger.info(
                        "invoking agent",
                        extra={
                            "request_id": request_id,
                            "agent": type(agent).__name__,
                        },
                    )
                    response = agent.handle(message, context)
                    break
            except Exception:
                metrics.errors += 1
                logger.exception(
                    "agent error",
                    extra={"request_id": request_id, "agent": type(agent).__name__},
                )
                continue

        if response is None:
            response = context

        if self.coach is not None:
            coaching = self.coach.generate(context)
            response = f"{response}\n\n{coaching}".strip()

        final = filter_output(response)
        self._save_memory_async(message, "user")
        self._save_memory_async(final, "assistant")
        return final
        response = apply_style(response)
        return filter_output(response)
