import importlib.util
from pathlib import Path
import sys

import pytest


def _load_core_config():
    """Load ``core.config`` without importing the entire ``core`` package."""
    spec = importlib.util.spec_from_file_location("core.config", Path("core/config.py"))
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_missing_api_keys_raise_error(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)

    core_config = _load_core_config()
    with pytest.raises(EnvironmentError) as excinfo:
        core_config.load_config(validate=True)
    msg = str(excinfo.value)
    assert "OPENAI_API_KEY" in msg and "ELEVENLABS_API_KEY" in msg
