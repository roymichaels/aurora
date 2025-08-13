"""Tests for tracking agent call metrics."""

from core.brain import BrainAgent
import core.brain as brain_module
from core.metrics import metrics

brain_module.save_memory = lambda _text, _metadata: 0


def _reset_metrics() -> None:
    metrics.conversations = 0
    metrics.memory_queries = 0
    metrics.errors = 0
    metrics.planner_calls = 0
    metrics.hypnosis_calls = 0
    metrics.coaching_calls = 0
    metrics.router_local = 0
    metrics.router_cloud = 0
    metrics.gemini_calls = 0
    metrics.chatgpt_calls = 0


def test_planner_calls_are_counted() -> None:
    _reset_metrics()

    class PlannerAgent:
        def can_handle(self, message: str) -> bool:
            return True

        def handle(self, message: str, context: str) -> str:
            return "plan"

    brain = BrainAgent(
        persona_store=lambda: "",
        memory_store=lambda _msg, exclude_ids=None: [],
        agents=[PlannerAgent()],
    )
    brain.process("anything")

    assert metrics.planner_calls == 1


def test_hypnosis_calls_are_counted() -> None:
    _reset_metrics()

    class HypnosisAgent:
        def can_handle(self, message: str) -> bool:
            return True

        def handle(self, message: str, context: str) -> str:
            return "hypnosis"

    brain = BrainAgent(
        persona_store=lambda: "",
        memory_store=lambda _msg, exclude_ids=None: [],
        agents=[HypnosisAgent()],
    )
    brain.process("anything")

    assert metrics.hypnosis_calls == 1


def test_coaching_calls_are_counted() -> None:
    _reset_metrics()

    class DummyAgent:
        def can_handle(self, message: str) -> bool:
            return True

        def handle(self, message: str, context: str) -> str:
            return "base"

    class CoachingAgent:
        def generate(self, context: str) -> str:
            return "coach"

    brain = BrainAgent(
        persona_store=lambda: "",
        memory_store=lambda _msg, exclude_ids=None: [],
        agents=[DummyAgent()],
        coach=CoachingAgent(),
    )
    brain.process("anything")

    assert metrics.coaching_calls == 1


def test_multiple_agent_outputs_are_merged_and_counted() -> None:
    _reset_metrics()

    class PlannerAgent:
        def can_handle(self, message: str) -> bool:
            return True

        def handle(self, message: str, context: str) -> str:
            return "plan"

    class HypnosisAgent:
        def can_handle(self, message: str) -> bool:
            return True

        def handle(self, message: str, context: str) -> str:
            return "hypnosis"

    brain = BrainAgent(
        persona_store=lambda: "",
        memory_store=lambda _msg, exclude_ids=None: [],
        agents=[PlannerAgent(), HypnosisAgent()],
    )

    result = brain.process("anything")

    assert result == "plan\n\nhypnosis"
    assert metrics.planner_calls == 1
    assert metrics.hypnosis_calls == 1
