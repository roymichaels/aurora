from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass
class Metrics:
    conversations: int = 0
    memory_queries: int = 0
    errors: int = 0
    planner_calls: int = 0
    hypnosis_calls: int = 0
    coaching_calls: int = 0

    def as_dict(self) -> dict[str, int]:
        return asdict(self)

    def increment_agent(self, name: str) -> None:
        """Increment the call counter for a given agent name.

        ``name`` should be the lower-case agent identifier without the
        ``Agent`` suffix, e.g. ``"planner"`` or ``"hypnosis"``.
        """
        attr = f"{name}_calls"
        if hasattr(self, attr):
            setattr(self, attr, getattr(self, attr) + 1)


metrics = Metrics()
