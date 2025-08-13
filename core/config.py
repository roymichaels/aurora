from __future__ import annotations

"""Central configuration management for core, voice, and api modules."""

from dataclasses import dataclass
import os


@dataclass
class ModelConfig:
    """Configuration for selecting local or remote models."""

    local: str | None = None
    cloud: str | None = None
    voice_model_path: str | None = None
    voice_api_endpoint: str | None = None


@dataclass
class APIKeys:
    """Stores API keys for external services."""

    openai: str | None = None
    elevenlabs: str | None = None

    def validate(self) -> None:
        """Ensure required API keys are present."""
        missing = [
            name
            for name, value in {
                "OPENAI_API_KEY": self.openai,
                "ELEVENLABS_API_KEY": self.elevenlabs,
            }.items()
            if not value
        ]
        if missing:
            raise EnvironmentError(
                "Missing environment variables: " + ", ".join(missing)
            )


@dataclass
class RuntimeOptions:
    """Miscellaneous runtime toggles."""

    debug: bool = False


@dataclass
class AppConfig:
    """Aggregate application configuration."""

    models: ModelConfig
    api_keys: APIKeys
    runtime: RuntimeOptions

    def validate(self) -> None:
        """Validate configuration and raise if any required values are missing."""
        self.api_keys.validate()


def load_config(*, validate: bool = False) -> AppConfig:
    """Load application configuration from environment variables.

    Parameters
    ----------
    validate:
        When ``True``, ``AppConfig.validate`` is invoked before returning and
        missing required environment variables will raise ``EnvironmentError``.
    """
    cfg = AppConfig(
        models=ModelConfig(
            local=os.getenv("LOCAL_MODEL"),
            cloud=os.getenv("CLOUD_MODEL"),
            voice_model_path=os.getenv("VOICE_MODEL_PATH"),
            voice_api_endpoint=os.getenv("VOICE_API_ENDPOINT"),
        ),
        api_keys=APIKeys(
            openai=os.getenv("OPENAI_API_KEY"),
            elevenlabs=os.getenv("ELEVENLABS_API_KEY"),
        ),
        runtime=RuntimeOptions(
            debug=os.getenv("DEBUG", "").lower() in {"1", "true", "yes"}
        ),
    )
    if validate:
        cfg.validate()
    return cfg


CONFIG: AppConfig = load_config()
