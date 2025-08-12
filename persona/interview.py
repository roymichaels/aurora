"""Simple CLI interview to capture a user's persona preferences."""
import json
from pathlib import Path

QUESTIONS = [
    ("tone", "How would you describe your preferred communication tone?"),
    ("values", "What personal values should the AI reflect?"),
    (
        "signature_phrases",
        "List any signature phrases you often use (comma separated):",
    ),
]


def run_interview() -> None:
    """Prompt the user with questions and store answers in profile.json."""
    profile = {}
    for key, prompt in QUESTIONS:
        answer = input(prompt + " ").strip()
        if key == "signature_phrases":
            profile[key] = [p.strip() for p in answer.split(",") if p.strip()]
        else:
            profile[key] = answer

    path = Path(__file__).with_name("profile.json")
    path.write_text(json.dumps(profile, indent=2))
    print(f"Profile saved to {path}")


if __name__ == "__main__":
    run_interview()
