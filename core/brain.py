"""Central Brain agent for orchestrating specialized sub-agents.

This module defines :class:`BrainAgent`, the primary coordinator of the
personal AI Brain system.  It retrieves persona and memory context before
dispatching a user message to a suitable sub-agent.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Iterable, Protocol, Sequence

from agents.coaching import CoachingAgent
from safety.filter import filter_output


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

    def process(self, message: str) -> str:
        """Process a user ``message`` by delegating to a sub-agent.

        The method retrieves persona and memory snippets, constructs the
        master prompt, and invokes the first agent capable of handling the
        message.  If no agent accepts the message, the composed prompt is
        returned so callers can decide how to handle it.
        """

        persona = self.persona_store() or ""
        memories = list(self.memory_store(message))
        memory_text = "\n".join(memories)
        context = self.prompt_template.format(persona=persona, memories=memory_text)

        response = None
        for agent in self.agents:
            try:
                if agent.can_handle(message):
                    response = agent.handle(message, context)
                    break
            except Exception:
                # A misbehaving agent should not crash the BrainAgent
                continue

        if response is None:
            response = context

        if self.coach is not None:
            coaching = self.coach.generate(context)
            response = f"{response}\n\n{coaching}".strip()

        return filter_output(response)
