from orchestration.router import ModelRouter, RouterConfig
from core.metrics import metrics


def test_router_increments_gemini_calls(monkeypatch):
    monkeypatch.setattr("orchestration.router.is_online", lambda: True)
    metrics.gemini_calls = 0
    metrics.chatgpt_calls = 0

    def gemini_model(prompt: str) -> str:
        return "gemini"

    def chatgpt_model(prompt: str) -> str:
        return "chatgpt"

    router = ModelRouter(gemini_model, chatgpt_model, config=RouterConfig(max_gemini_tokens=5))
    router.route("short prompt")

    data = metrics.as_dict()
    assert data["gemini_calls"] == 1
    assert data["chatgpt_calls"] == 0


def test_router_increments_chatgpt_calls(monkeypatch):
    monkeypatch.setattr("orchestration.router.is_online", lambda: True)
    metrics.gemini_calls = 0
    metrics.chatgpt_calls = 0

    def gemini_model(prompt: str) -> str:
        return "gemini"

    def chatgpt_model(prompt: str) -> str:
        return "chatgpt"

    config = RouterConfig(max_gemini_tokens=5, depth_threshold=0, max_chatgpt_cost=1.0)
    router = ModelRouter(gemini_model, chatgpt_model, config=config)
    router.route("long prompt " * 50, depth=1)

    data = metrics.as_dict()
    assert data["chatgpt_calls"] == 1
    assert data["gemini_calls"] == 0
