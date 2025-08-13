from __future__ import annotations

"""Configuration for voice synthesis backends."""

from dataclasses import dataclass

from core.config import CONFIG as CORE_CONFIG


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
    """Load configuration from the central app config."""
    models = CORE_CONFIG.models
    return VoiceConfig(
        model_path=models.voice_model_path,
        api_endpoint=models.voice_api_endpoint,
    )


CONFIG: VoiceConfig = load_config()
