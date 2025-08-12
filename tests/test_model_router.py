from pathlib import Path
import importlib.util
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

spec = importlib.util.spec_from_file_location(
    "router", BASE_DIR / "orchestration" / "router.py"
)
router_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = router_module
spec.loader.exec_module(router_module)

abstract_sensitive_data = router_module.abstract_sensitive_data
ModelRouter = router_module.ModelRouter
RouterConfig = router_module.RouterConfig
UsageLogger = router_module.UsageLogger


def test_abstract_sensitive_data_masks_email():
    text = "Reach me at user@example.com for updates"
    sanitized = abstract_sensitive_data(text)
    assert "user@example.com" not in sanitized
    assert "[REDACTED_EMAIL]" in sanitized


def test_abstract_sensitive_data_masks_phone():
    text = "Call 123-456-7890 tomorrow"
    sanitized = abstract_sensitive_data(text)
    assert "123-456-7890" not in sanitized
    assert "[REDACTED_PHONE]" in sanitized


def test_model_router_sanitizes_prompt_before_cloud(monkeypatch, tmp_path):
    captured = {}

    def local_model(prompt: str) -> str:
        captured["local"] = prompt
        return "local"

    def cloud_model(prompt: str) -> str:
        captured["cloud"] = prompt
        return "cloud"

    config = RouterConfig(max_local_tokens=1)
    logger = UsageLogger(tmp_path / "usage.log")
    router = ModelRouter(local_model, cloud_model, config=config, logger=logger)

    monkeypatch.setattr(router_module, "is_online", lambda: True)

    prompt = "Email user@example.com or call 123-456-7890"
    result = router.route(prompt)

    assert result == "cloud"
    assert captured["cloud"] == "Email [REDACTED_EMAIL] or call [REDACTED_PHONE]"
    assert "local" not in captured
