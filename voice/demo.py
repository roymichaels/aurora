"""Simple demonstration of the voice synthesis configuration."""
from __future__ import annotations

from pathlib import Path

from .config import CONFIG
from .tts import synthesize_reply


def main() -> None:
    text = "Hello from the Aurora voice demo!"
    audio = synthesize_reply(text)
    out_path = Path("demo_output.wav")
    out_path.write_bytes(audio)
    backend = CONFIG.api_endpoint or CONFIG.model_path or "default model"
    print(f"Generated demo audio using {backend} -> {out_path}")


if __name__ == "__main__":
    main()
