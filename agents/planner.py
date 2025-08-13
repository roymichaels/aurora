"""Simple planning agent for breaking goals into steps.

This module defines :class:`PlannerAgent` which can generate a small
checklist for a given goal.  Plans are also persisted via the memory
store using the ``plan`` tag so they can be retrieved later.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from memory import store
from settings import settings


@dataclass
class PlannerAgent:
    """Generate basic plans for user goals.

    Optional calendar or todo API clients can be supplied to push the
    generated steps to external services.
    """

    calendar_api: Any | None = None
    todo_api: Any | None = None

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
        """Generate a plan, optionally push to integrations and persist."""

        goal = message.split(" ", 1)[1] if " " in message else ""
        goal = goal.strip() or "your goal"
        steps = self.plan(goal)

        # Map each step to any external task/event IDs for later follow-up.
        external_ids: Dict[str, Dict[str, str]] = {}

        if settings.get("integrations", {}).get("calendar") and self.calendar_api:
            calendar_ids = {
                step: self.calendar_api.create_event(step) for step in steps
            }
            if calendar_ids:
                external_ids["calendar"] = calendar_ids

        if settings.get("integrations", {}).get("todo") and self.todo_api:
            todo_ids = {step: self.todo_api.create_task(step) for step in steps}
            if todo_ids:
                external_ids["todo"] = todo_ids

        store.save_plan(goal, steps, external_ids or None)
        numbered = "\n".join(
            f"{i + 1}. {step}" for i, step in enumerate(steps)
        )
        return f"Plan for {goal}:\n{numbered}"

