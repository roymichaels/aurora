import json
import os
from typing import Any, Dict

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

_DEFAULTS: Dict[str, Any] = {
    "integrations": {"calendar": False, "todo": False}
}


def load_settings() -> Dict[str, Any]:
    """Load configuration from disk with sensible defaults."""
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {}
    settings: Dict[str, Any] = {**_DEFAULTS, **data}
    if "integrations" in data:
        settings["integrations"] = {
            **_DEFAULTS["integrations"],
            **data.get("integrations", {}),
        }
    return settings


settings = load_settings()
