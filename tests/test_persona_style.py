import json
from pathlib import Path

from core.brain import BrainAgent
from persona.style import load_persona


class EchoAgent:
    def can_handle(self, message: str) -> bool:
        return True

    def handle(self, message: str, context: str) -> str:
        profile = load_persona()
        tone = profile.get("tone", "")
        phrases = profile.get("signature_phrases", [])
        result = "Hello there"
        if tone:
            result = f"{tone} {result}"
        if phrases:
            prefix = phrases[0]
            suffix = phrases[-1] if len(phrases) > 1 else phrases[0]
            result = f"{prefix} {result} {suffix}"
        return result


def test_persona_profile_applied(tmp_path):
    profile_path = Path("persona/profile.json")
    original = profile_path.read_text()
    profile_path.write_text(
        json.dumps(
            {
                "tone": "enthusiastic",
                "values": "growth",
                "signature_phrases": ["Let's roll", "Stay sharp"],
            }
        )
    )

    try:
        brain = BrainAgent(
            persona_store=lambda: "",
            memory_store=lambda _msg, exclude_ids=None: [],
            agents=[EchoAgent()],
        )
        result = brain.process("Hi")
        assert result.startswith("Let's roll")
        assert "enthusiastic" in result
        assert "[" not in result
        assert "]" not in result
        assert result.endswith("Stay sharp")
        profile = load_persona()
        assert profile["values"] == "growth"
    finally:
        profile_path.write_text(original)
