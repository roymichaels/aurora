from orchestration.router import ModelRouter, RouterConfig


def test_short_prompt_routes_to_gemini(monkeypatch):
    monkeypatch.setattr("orchestration.router.is_online", lambda: True)

    gemini_calls: list[str] = []
    chatgpt_calls: list[str] = []

    def gemini_model(prompt: str) -> str:
        gemini_calls.append(prompt)
        return "gemini"

    def chatgpt_model(prompt: str) -> str:
        chatgpt_calls.append(prompt)
        return "chatgpt"

    router = ModelRouter(gemini_model, chatgpt_model, config=RouterConfig(max_gemini_tokens=5))
    router.route("hi there")

    assert gemini_calls
    assert not chatgpt_calls


def test_complex_prompt_routes_to_chatgpt(monkeypatch):
    monkeypatch.setattr("orchestration.router.is_online", lambda: True)

    gemini_calls: list[str] = []
    chatgpt_calls: list[str] = []

    def gemini_model(prompt: str) -> str:
        gemini_calls.append(prompt)
        return "gemini"

    def chatgpt_model(prompt: str) -> str:
        chatgpt_calls.append(prompt)
        return "chatgpt"

    config = RouterConfig(max_gemini_tokens=5, depth_threshold=2, max_chatgpt_cost=1.0)
    router = ModelRouter(gemini_model, chatgpt_model, config=config)
    router.route("complex prompt " * 20, depth=3)

    assert chatgpt_calls
    assert not gemini_calls
