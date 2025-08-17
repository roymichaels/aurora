import os

from fastapi.testclient import TestClient

from api.memory import app
from memory import store as mem


API_KEY = "secret"


def setup_function(_):
    # ensure a clean slate for each test
    mem.cur.execute("DELETE FROM memories")
    mem.conn.commit()
    mem.vector_store.clear()
    os.environ["MEMORY_API_KEY"] = API_KEY


def auth_headers(key: str = API_KEY) -> dict[str, str]:
    return {"X-API-Key": key}


def test_delete_removes_embedding_and_metadata():
    client = TestClient(app)
    resp = client.post(
        "/memories",
        json={"text": "delete me", "metadata": {"tag": "temp"}},
        headers=auth_headers(),
    )
    assert resp.status_code == 200
    mem_id = resp.json()["id"]

    # ensure the memory can be retrieved before deletion
    assert mem.query_memory("delete me")

    del_resp = client.delete(f"/memories/{mem_id}", headers=auth_headers())
    assert del_resp.status_code == 200

    # embedding should be gone
    assert mem.query_memory("delete me") == []

    # database row should be removed
    mem.cur.execute("SELECT id FROM memories WHERE id=?", (mem_id,))
    assert mem.cur.fetchone() is None


def test_request_without_api_key_is_unauthorized():
    client = TestClient(app)
    resp = client.get("/memories")
    assert resp.status_code == 401


def test_request_with_wrong_api_key_is_unauthorized():
    client = TestClient(app)
    resp = client.get("/memories", headers=auth_headers("bad"))
    assert resp.status_code == 401
