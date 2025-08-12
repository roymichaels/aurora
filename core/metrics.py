from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass
class Metrics:
    conversations: int = 0
    memory_queries: int = 0
    errors: int = 0

    def as_dict(self) -> dict[str, int]:
        return asdict(self)


metrics = Metrics()
