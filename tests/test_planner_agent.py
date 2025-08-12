import json

import json

from agents.planner import PlannerAgent
from memory import store
import settings


class DummyCalendarAPI:
    def __init__(self):
        self.counter = 0

    def create_event(self, step: str) -> str:  # pragma: no cover - trivial
        self.counter += 1
        return f"cal-{self.counter}"


class DummyTodoAPI:
    def __init__(self):
        self.counter = 0

    def create_task(self, step: str) -> str:  # pragma: no cover - trivial
        self.counter += 1
        return f"todo-{self.counter}"


def test_plan_persists_external_ids():
    settings.settings["integrations"] = {"calendar": True, "todo": True}

    # clean memory table
    with store.db_lock:
        store.cur.execute("DELETE FROM memories")
        store.conn.commit()

    agent = PlannerAgent(
        calendar_api=DummyCalendarAPI(), todo_api=DummyTodoAPI()
    )
    agent.handle("plan launch", "")

    with store.db_lock:
        store.cur.execute(
            "SELECT metadata FROM memories ORDER BY id DESC LIMIT 1"
        )
        meta_json = store.cur.fetchone()[0]
    meta = json.loads(meta_json)

    assert "external_ids" in meta
    assert len(meta["external_ids"]["calendar"]) == 4
    assert len(meta["external_ids"]["todo"]) == 4
