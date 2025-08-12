"""Motivational coaching agent for encouraging positive action.

This lightweight agent synthesizes a short coaching message using
pre-defined templates focused on micro-commitments and positive
self-talk.  The goal is to provide gentle nudges that keep the user
moving forward.  Recent goal memories are consulted so the reply can
adapt affirmations based on whether the user has been succeeding or
struggling lately.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field

from memory import store


@dataclass
class CoachingAgent:
    """Generate motivational snippets for the Brain agent.

    The agent exposes :meth:`generate` which accepts a ``context`` string
    (usually the master prompt assembled by :class:`core.brain.BrainAgent`) and
    returns a short motivational reply.
    """

    templates: dict[str, dict[str, dict[str, str] | list[str]]] = field(
        default_factory=lambda: {
            "health": {
                "keywords": ["health", "exercise", "fitness", "workout", "run"],
                "progress": {
                    "on_track": {
                        "step": "take a quick stretch or brisk walk",
                        "affirmation": "I care for my body and it rewards me",
                        "template": (
                            "You're on track. Your body thrives on movement. Commit to {step}. Tell yourself: \"{affirmation}\""
                        ),
                    },
                    "stalled": {
                        "step": "take a quick stretch or brisk walk",
                        "affirmation": "Every restart makes me stronger",
                        "template": (
                            "Setbacks happen. Restart with {step}. Tell yourself: \"{affirmation}\""
                        ),
                    },
                },
            },
            "study": {
                "keywords": ["study", "learn", "exam", "homework", "read"],
                "progress": {
                    "on_track": {
                        "step": "review just one page of notes",
                        "affirmation": "Every bit of study grows my skills",
                        "template": (
                            "You're on track. Feed your curiosity: {step}. Remind yourself: \"{affirmation}\""
                        ),
                    },
                    "stalled": {
                        "step": "review just one page of notes",
                        "affirmation": "Every restart refocuses me",
                        "template": (
                            "It's okay to feel stuck. {step} to regain momentum. Remind yourself: \"{affirmation}\""
                        ),
                    },
                },
            },
            "default": {
                "keywords": [],
                "progress": {
                    "on_track": {
                        "step": "start with just two minutes of focused effort",
                        "affirmation": "I am capable and every small step matters",
                        "template": (
                            "You're on track. Commit to one tiny action in the next few minutes: {step}. Tell yourself: \"{affirmation}\""
                        ),
                    },
                    "stalled": {
                        "step": "start with just two minutes of focused effort",
                        "affirmation": "Each restart matters",
                        "template": (
                            "Small restarts matter. Commit to one tiny action: {step}. Tell yourself: \"{affirmation}\""
                        ),
                    },
                },
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

    def _progress_state(self, k: int = 5) -> str:
        """Return ``on_track`` or ``stalled`` based on recent goal memories."""

        with store.db_lock:
            store.cur.execute(
                "SELECT metadata FROM memories ORDER BY id DESC LIMIT ?", (k,)
            )
            rows = store.cur.fetchall()
        success = struggle = 0
        for (meta_json,) in rows:
            try:
                meta = json.loads(meta_json) if meta_json else {}
            except Exception:
                meta = {}
            if meta.get("tag") == "goal":
                status = meta.get("status")
                if status == "success":
                    success += 1
                elif status == "struggle":
                    struggle += 1
        if success >= struggle:
            return "on_track"
        return "stalled"

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
        progress = self._progress_state()
        data = self.templates[theme]["progress"][progress]
        return data["template"].format(
            step=data["step"], affirmation=data["affirmation"]
        )
