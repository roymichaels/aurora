from agents.hypnosis import HypnosisAgent


def test_generate_returns_all_sections_in_order():
    text = HypnosisAgent.generate("It's a quiet evening.", "crush tomorrow's presentation")
    sections = text.split("\n\n")
    expected = [
        "Preparation:",
        "Induction:",
        "Deepening:",
        "Visualization:",
        "Suggestion:",
        "Anchoring:",
        "Awakening:",
    ]
    assert len(sections) == len(expected)
    for part, name in zip(sections, expected):
        assert part.startswith(name)


def test_optional_parameters_affect_suggestion_text():
    base = HypnosisAgent.generate("calm setting", "feel rested")
    custom = HypnosisAgent.generate(
        "calm setting",
        "feel rested",
        duration=120,
        mode="confidence",
        anchor_cue="touch thumb and index finger",
        anchor_phrase="rested and ready",
    )

    assert "This session lasts about 120 seconds." in custom
    assert "a steady confidence fills you with each breath" in custom
    assert "touch thumb and index finger" in custom
    assert "rested and ready" in custom

    assert "a gentle calm spreads through every part of you" in base
    assert "a gentle calm spreads through every part of you" not in custom
    assert "press your thumb and forefinger together" in base
