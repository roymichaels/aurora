"""Shared prompt builder for persona and memory context."""
from __future__ import annotations

from typing import Iterable, Sequence


def build_prompt(
    persona: str,
    memories: Iterable[str],
    behavior_style: str = "",
    skills: Sequence[str] | None = None,
    filters: Sequence[str] | None = None,
) -> str:
    """Construct the master prompt.

    Parameters
    ----------
    persona:
        Description of the user's ideal persona.
    memories:
        Iterable of memory snippets relevant to the current conversation.
    behavior_style:
        Optional description of the assistant's behavior style.
    skills:
        Optional sequence describing available skills.
    filters:
        Optional sequence naming active output filters.
    """

    skills = skills or []
    filters = filters or []
    parts = [
        "You are the idealized version of the user.",
        f"Persona: {persona}",
        "Relevant memories:",
        "\n".join(memories),
    ]
    if behavior_style:
        parts.append(f"Behavior style: {behavior_style}")
    if skills:
        parts.append("Available skills: " + "; ".join(skills))
    if filters:
        parts.append("Applied filters: " + ", ".join(filters))
    return "\n".join(parts).strip()
