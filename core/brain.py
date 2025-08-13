"""Central Brain agent for orchestrating specialized sub-agents.

This module defines :class:`BrainAgent`, the primary coordinator of the
personal AI Brain system.  It retrieves persona and memory context before
dispatching a user message to a suitable sub-agent.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterable, Mapping, Protocol, Sequence

from agents.coaching import CoachingAgent
from memory.store import save_memory
from persona.style import style_instructions
from safety.filter import filter_output
from orchestration.router import ModelRouter, UsageLogger
from .logger import get_logger
from .metrics import metrics
from .prompt import build_prompt


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
        snippets relevant to that message.  Each item may be either a plain
        string or a mapping containing a ``text`` field.
    agents:
        Sequence of sub-agents responsible for specific tasks.  Each must
        implement :class:`SupportsAgent`.
    coach:
        Optional :class:`CoachingAgent` that always generates a short
        motivational snippet which is appended to the chosen agent's
        response.
    behavior_style:
        Optional description of the assistant's behavior style to include in
        the prompt.
    skills:
        Optional sequence describing available skills.
    filters:
        Optional sequence naming active output filters.
    """

    persona_store: Callable[[], str]
    memory_store: Callable[
        [str, Iterable[int] | None], Iterable[str | Mapping[str, Any]]
    ]
    agents: Sequence[SupportsAgent] = field(default_factory=list)
    coach: CoachingAgent | None = None
    prompt_template: str = (
        "You are the idealized version of the user.\n"
        "Persona: {persona}\n"
        "{style_instructions}"
        "Relevant memories:\n{memories}\n"
    )

    router: ModelRouter = field(init=False)
    _current_agent: SupportsAgent | None = field(init=False, default=None)
    _current_message: str = field(init=False, default="")
    _recent_memory_ids: list[int] = field(init=False, default_factory=list)

    def __post_init__(self) -> None:
        self.router = ModelRouter(
            self._local_model, self._cloud_model, logger=UsageLogger()
        )

    def _local_model(self, prompt: str) -> str:
        if self._current_agent is not None:
            return self._current_agent.handle(self._current_message, prompt)
        return prompt

    def _cloud_model(self, prompt: str) -> str:
        return self._local_model(prompt)

    def _save_memory_async(self, text: str, role: str) -> None:
        """Persist ``text`` with ``role`` metadata and record its ID."""

        mem_id = save_memory(text, {"role": role})
        self._recent_memory_ids.append(mem_id)

    def _retrieve_memories(self, message: str) -> list[str]:
        """Fetch relevant memories and track those shown to the user.

        The helper consults :attr:`memory_store` while ensuring that any
        previously saved or displayed memories are excluded.  Returned
        memories are limited to five items and any provided ``id`` values are
        added to ``_recent_memory_ids`` so they won't be surfaced again in
        the current session.
        """

        try:
            raw = list(self.memory_store(message, exclude_ids=self._recent_memory_ids))
        except Exception:
            raise

        memories: list[str] = []
        for mem in raw[:5]:
            if isinstance(mem, Mapping):
                text = mem.get("text")
                mid = mem.get("id")
                if mid is not None:
                    try:
                        self._recent_memory_ids.append(int(mid))
                    except Exception:
                        pass
                if text:
                    memories.append(str(text))
            else:
                memories.append(str(mem))
        return memories

    def process(self, message: str, request_id: str | None = None) -> str:
        """Process a user ``message`` by delegating to a sub-agent.

        The method retrieves persona and memory snippets, constructs the
        master prompt, and invokes the first agent capable of handling the
        message.  If no agent accepts the message, the composed prompt is
        returned so callers can decide how to handle it.
        """

        logger = get_logger(__name__)
        metrics.conversations += 1
        logger.info(
            "processing message",
            extra={"request_id": request_id, "agent": "BrainAgent"},
        )

        persona = self.persona_store() or ""

        try:
            memories = self._retrieve_memories(message)
        except Exception:
            metrics.errors += 1
            logger.exception(
                "memory store error",
                extra={"request_id": request_id, "agent": "memory_store"},
            )
            memories = []
        else:
            metrics.memory_queries += 1

        memory_text = "\n".join(memories)
        style_prompt = style_instructions()
        context = self.prompt_template.format(
            persona=persona,
            memories=memory_text,
            style_instructions=(style_prompt + "\n") if style_prompt else "",
        )

        responses: list[str] = []
        exclusive_response: str | None = None
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
                    agent_name = type(agent).__name__.replace("Agent", "").lower()
                    metrics.increment_agent(agent_name)
                    reply = agent.handle(message, context)
                    if getattr(agent, "exclusive", False):
                        exclusive_response = reply
                        break
                    responses.append(reply)
            except Exception:
                metrics.errors += 1
                logger.exception(
                    "agent error",
                    extra={"request_id": request_id, "agent": type(agent).__name__},
                )
                continue

        if exclusive_response is not None:
            response = exclusive_response
        elif responses:
            response = "\n\n".join(responses)
        else:
            self._current_agent = None
            self._current_message = message
            combined = f"{context}\nUser message:\n{message}"
            response = self.router.route(combined)

        if self.coach is not None:
            coaching = self.coach.generate(context)
            coach_name = type(self.coach).__name__.replace("Agent", "").lower()
            metrics.increment_agent(coach_name)
            response = f"{response}\n\n{coaching}".strip()

        final = filter_output(response)
        self._save_memory_async(message, "user")
        self._save_memory_async(final, "assistant")
        return final
