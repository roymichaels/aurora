"""Agent package for specialized behaviors."""

from .hypnosis import HypnosisAgent

__all__ = ["HypnosisAgent"]

"""Specialized agent modules."""
from .coaching import CoachingAgent
from .planner import PlannerAgent

__all__ = ["CoachingAgent", "PlannerAgent"]
