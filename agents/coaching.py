"""Motivational coaching agent for encouraging positive action.

This lightweight agent synthesizes a short coaching message using
pre-defined templates focused on micro-commitments and positive
self-talk.  The goal is to provide gentle nudges that keep the user
moving forward.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class CoachingAgent:
    """Generate motivational snippets for the Brain agent.

    The agent exposes :meth:`generate` which accepts a ``context`` string
    (usually the master prompt assembled by :class:`core.brain.BrainAgent`) and
    returns a short motivational reply.
    """

    templates: dict[str, dict[str, str]] = field(
        default_factory=lambda: {
            "health": {
                "keywords": ["health", "exercise", "fitness", "workout", "run"],
                "step": "take a quick stretch or brisk walk",
                "affirmation": "I care for my body and it rewards me",
                "template": (
                    "Your body thrives on movement. Commit to {step}. Tell yourself: \"{affirmation}\""
                ),
            },
            "study": {
                "keywords": ["study", "learn", "exam", "homework", "read"],
                "step": "review just one page of notes",
                "affirmation": "Every bit of study grows my skills",
                "template": (
                    "Feed your curiosity: {step}. Remind yourself: \"{affirmation}\""
                ),
            },
            "default": {
                "keywords": [],
                "step": "start with just two minutes of focused effort",
                "affirmation": "I am capable and every small step matters",
                "template": (
                    "Commit to one tiny action in the next few minutes: {step}. Tell yourself: \"{affirmation}\""
                ),
            },
        }
    )

    def detect_theme(self, context: str) -> str:
        """Return a theme name based on keyword matches in ``context``."""
        lower = context.lower()
        for theme, data in self.templates.items():
            for keyword in data.get("keywords", []):
                if keyword in lower:
                    return theme
        return "default"

    def generate(self, context: str) -> str:
        """Craft a motivational reply from ``context``.

        Parameters
        ----------
        context:
            Full context string prepared by :class:`BrainAgent` which may
            include persona and memory information.  The current
            implementation does not parse the context deeply; it simply
            uses it as inspiration for a generic but encouraging message.

        Returns
        -------
        str
            A coaching message combining a micro-commitment suggestion and
            a line of positive self-talk.
        """

        theme = self.detect_theme(context)
        data = self.templates[theme]
        return data["template"].format(
            step=data["step"], affirmation=data["affirmation"]
        )
