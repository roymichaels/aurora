from fastapi import FastAPI
from fastapi.testclient import TestClient

from core.brain import BrainAgent

app = FastAPI()

state = {
    "persona": "",
    "memories": [],
}


@app.post("/onboard")
def onboard(payload: dict):
    """Store the user's persona information."""
    state["persona"] = payload["persona"]
    return {"status": "ok"}


@app.post("/chat")
def chat(payload: dict):
    """Process a chat message and persist it to memory."""
    message = payload["message"]
    brain = BrainAgent(
        persona_store=lambda: state["persona"],
        memory_store=lambda _msg, exclude_ids=None: state["memories"],
    )
    reply = brain.process(message)
    state["memories"].append(message)
    return {"reply": reply}


@app.get("/memory")
def get_memory():
    """Return stored memory snippets."""
    return {"memories": state["memories"]}


def test_conversation_flow():
    client = TestClient(app)

    # Onboarding step
    res = client.post("/onboard", json={"persona": "curious coder"})
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

    # First chat message is saved to memory
    res = client.post("/chat", json={"message": "I love unit tests"})
    assert res.status_code == 200
    assert "Persona: curious coder" in res.json()["reply"]

    # Second chat should retrieve previous memory
    res = client.post("/chat", json={"message": "What do I love?"})
    assert res.status_code == 200
    assert "I love unit tests" in res.json()["reply"]

    # Direct memory retrieval
    res = client.get("/memory")
    assert res.status_code == 200
    assert "I love unit tests" in res.json()["memories"]
