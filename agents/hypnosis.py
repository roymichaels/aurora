"""Hypnosis agent generating brief guided imagery scripts."""

from dataclasses import dataclass


@dataclass
class HypnosisAgent:
    """Generate guided imagery scripts with a positive anchor."""

    @staticmethod
    def generate(context: str, goal: str) -> str:
        """Return a short hypnotic script.

        Args:
            context: Current user state or surroundings.
            goal: Desired outcome for the session.

        Returns:
            A brief guided imagery script ending with a positive anchor.
        """
        context = context.strip()
        goal = goal.strip()
        return (
            "Close your eyes and take a slow, deep breath. "
            f"{context} As you relax, picture {goal} unfolding with ease. "
            "With each breath, calm confidence spreads through you. "
            "Whenever you press your thumb and forefinger together, this steady calm returns." 
        )
