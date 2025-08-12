"""Motivational coaching agent for encouraging positive action.

This lightweight agent synthesizes a short coaching message using
pre-defined templates focused on micro-commitments and positive
self-talk.  The goal is to provide gentle nudges that keep the user
moving forward.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CoachingAgent:
    """Generate motivational snippets for the Brain agent.

    The agent exposes :meth:`generate` which accepts a ``context`` string
    (usually the master prompt assembled by :class:`core.brain.BrainAgent`) and
    returns a short motivational reply.
    """

    micro_commitment_template: str = (
        "Commit to one tiny action in the next few minutes: {step}."
    )
    positive_self_talk_template: str = (
        "Tell yourself: \"{affirmation}\""
    )

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

        step = "start with just two minutes of focused effort"
        affirmation = "I am capable and every small step matters"

        micro = self.micro_commitment_template.format(step=step)
        positive = self.positive_self_talk_template.format(
            affirmation=affirmation
        )
        return f"{micro} {positive}"
