from agents.coaching import CoachingAgent
from memory import store


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


def test_output_varies_with_history():
    agent = CoachingAgent()

    with store.db_lock:
        store.cur.execute("DELETE FROM memories")
        store.conn.commit()

    store.save_memory("finished workout", {"tag": "goal", "status": "success"})
    store.save_memory("ate salad", {"tag": "goal", "status": "success"})
    on_track = agent.generate(
        "I want to improve my health by doing more exercise"
    )

    with store.db_lock:
        store.cur.execute("DELETE FROM memories")
        store.conn.commit()

    store.save_memory("skipped workout", {"tag": "goal", "status": "struggle"})
    stalled = agent.generate(
        "I want to improve my health by doing more exercise"
    )

    assert on_track != stalled
    assert "on track" in on_track.lower()
    assert "setbacks" in stalled.lower() or "restart" in stalled.lower()
