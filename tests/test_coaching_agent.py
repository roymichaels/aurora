from agents.coaching import CoachingAgent


def test_generate_varies_with_context():
    agent = CoachingAgent()

    health = agent.generate(
        "I want to improve my health by doing more exercise"
    )
    study = agent.generate("I need to study for my upcoming exam")
    default = agent.generate("Just another day with no specific goal")

    assert health != study
    assert health != default
    assert study != default

    assert "stretch" in health or "walk" in health
    assert "page of notes" in study
    assert "two minutes" in default
