"""Hypnosis agent generating brief guided imagery scripts."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class HypnosisAgent:
    """Generate guided imagery scripts with a positive anchor."""

    @staticmethod
    def generate(
        context: str,
        goal: str,
        duration: Optional[int] = None,
        mode: Optional[str] = None,
    ) -> str:
        """Return a structured hypnotic script.

        Args:
            context: Current user state or surroundings.
            goal: Desired outcome for the session.
            duration: Optional length of the session in seconds.
            mode: Focus of the session, e.g. "confidence", "calm", "focus", "reset".

        Returns:
            A multi‑section guided imagery script ending with a positive anchor.
        """
        context = context.strip()
        goal = goal.strip()

        mode = (mode or "calm").lower()
        mode_lines = {
            "confidence": "a steady confidence fills you with each breath",
            "focus": "your mind sharpens on what matters most",
            "calm": "a gentle calm spreads through every part of you",
            "reset": "you release what no longer serves you and reset",
        }
        suggestion = mode_lines.get(mode, mode_lines["calm"])
        pace = (
            f"This session lasts about {duration} seconds. " if duration else ""
        )

        sections = [
            f"Preparation:\n{pace}{context} Allow yourself to get comfortable.",
            "Induction:\nClose your eyes and take slow, deep breaths, letting tension melt away.",
            "Deepening:\nWith each count from ten down to one, you feel twice as relaxed, drifting deeper.",
            (
                "Suggestion:\nAs you rest, "
                f"{suggestion}. Visualize {goal} as already unfolding perfectly. "
                "Whenever you press your thumb and forefinger together, this feeling returns."
            ),
            "Awakening:\nTake a final deep breath, gently wiggle your fingers, and open your eyes, bringing this feeling back with you.",
        ]

        return "\n\n".join(sections)
