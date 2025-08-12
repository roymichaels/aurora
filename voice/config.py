from __future__ import annotations

"""Configuration for voice synthesis backends."""

from dataclasses import dataclass
import os


@dataclass
class VoiceConfig:
    """Stores configuration for the text-to-speech engine.

    Attributes
    ----------
    model_path:
        Optional filesystem path to a local TTS model.
    api_endpoint:
        Optional HTTP endpoint for a remote TTS service.
    """
    model_path: str | None = None
    api_endpoint: str | None = None


def load_config() -> VoiceConfig:
    """Load configuration from environment variables."""
    return VoiceConfig(
        model_path=os.getenv("VOICE_MODEL_PATH"),
        api_endpoint=os.getenv("VOICE_API_ENDPOINT"),
    )


CONFIG: VoiceConfig = load_config()
