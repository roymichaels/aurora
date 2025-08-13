"""Shared prompt builder for persona and memory context."""
from __future__ import annotations

from typing import Iterable, Sequence


from typing import Iterable, Mapping, Sequence


def build_prompt(
    persona: str | Mapping[str, str] | None,
    brain_policy: str,
    memories: Iterable[str],
    behavior_style: str = "",
    skills: Sequence[str] | None = None,
    filters: Sequence[str] | None = None,
) -> str:
    """Construct the master prompt.

    Parameters
    ----------
    persona:
        Description of the user's ideal persona or mapping of persona fields.
    brain_policy:
        Text of the Brain Policy governing responses.
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
    parts: list[str] = [brain_policy.strip()]

    if isinstance(persona, str):
        if persona:
            parts.append(f"Persona: {persona}")
    elif persona:
        items = [(k, v) for k, v in persona.items() if v]
        if items:
            parts.append("Persona fields:")
            for key, value in sorted(items):
                parts.append(f"{key}: {value}")

    parts.append("Relevant memories:")
    parts.append("\n".join(memories))
    if behavior_style:
        parts.append(f"Behavior style: {behavior_style}")
    if skills:
        parts.append("Available skills: " + "; ".join(skills))
    if filters:
        parts.append("Applied filters: " + ", ".join(filters))
    return "\n".join(parts).strip()
