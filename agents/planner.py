"""Simple planning agent for breaking goals into steps.

This module defines :class:`PlannerAgent` which can generate a small
checklist for a given goal.  Plans are also persisted via the memory
store using the ``plan`` tag so they can be retrieved later.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from memory import store


@dataclass
class PlannerAgent:
    """Generate basic plans for user goals."""

    def can_handle(self, message: str) -> bool:
        """Return ``True`` if ``message`` appears to be a planning request."""

        return message.lower().strip().startswith("plan")

    def plan(self, goal: str) -> List[str]:
        """Produce a list of steps for ``goal``."""

        goal_phrase = goal.strip() or "the goal"
        return [
            f"Define what '{goal_phrase}' means to you",
            "Break the outcome into actionable tasks",
            "Schedule time blocks for each task",
            "Review progress and adjust the plan",
        ]

    def handle(self, message: str, context: str) -> str:
        """Generate a plan and persist it to memory."""

        goal = message.split(" ", 1)[1] if " " in message else ""
        goal = goal.strip() or "your goal"
        steps = self.plan(goal)
        store.save_plan(goal, steps)
        numbered = "\n".join(
            f"{i + 1}. {step}" for i, step in enumerate(steps)
        )
        return f"Plan for {goal}:\n{numbered}"

