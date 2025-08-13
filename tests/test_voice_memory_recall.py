"""Regression test ensuring voice replies use past utterances."""

import sys
import types

# Stub heavy optional dependencies before importing voice modules

fake_fw = types.ModuleType("faster_whisper")
class FakeWhisperModel:  # noqa: D401 - simple stub
    def __init__(self, *_, **__):
        pass
    def transcribe(self, path, language=None):  # noqa: D401 - simple stub
        class Seg:
            text = ""
        return [Seg()], None
fake_fw.WhisperModel = FakeWhisperModel
sys.modules.setdefault("faster_whisper", fake_fw)

fake_whisper = types.ModuleType("whisper")

def load_model(name):  # noqa: D401 - simple stub
    class Model:
        def transcribe(self, path, language=None):  # noqa: D401 - simple stub
            return {"text": ""}
    return Model()

fake_whisper.load_model = load_model
sys.modules.setdefault("whisper", fake_whisper)

fake_tts_api = types.ModuleType("TTS.api")
class FakeTTS:  # noqa: D401 - simple stub
    def __init__(self, *_, **__):
        pass
    def tts(self, text, speaker_wav=None):  # noqa: D401 - simple stub
        return [0.0]
    @property
    def synthesizer(self):  # noqa: D401 - simple stub
        class Synth:
            output_sample_rate = 22050
        return Synth()
fake_tts_api.TTS = FakeTTS
sys.modules.setdefault("TTS", types.ModuleType("TTS"))
sys.modules["TTS.api"] = fake_tts_api

fake_sf = types.ModuleType("soundfile")

def write(buf, audio, samplerate, format):  # noqa: D401 - simple stub
    buf.write(b"")

fake_sf.write = write
sys.modules.setdefault("soundfile", fake_sf)

fake_fastapi = types.ModuleType("fastapi")
class FastAPI:  # noqa: D401 - simple stub
    def __init__(self, *_, **__):
        pass
    def get(self, *_, **__):
        return lambda fn: fn
    def post(self, *_, **__):
        return lambda fn: fn
class Request:  # noqa: D401 - simple stub
    async def json(self):
        return {}
fake_fastapi.FastAPI = FastAPI
fake_fastapi.Request = Request
sys.modules.setdefault("fastapi", fake_fastapi)

fake_aiortc = types.ModuleType("aiortc")
class RTCPeerConnection:  # noqa: D401 - simple stub
    def createDataChannel(self, *_, **__):
        return types.SimpleNamespace(send=lambda data: None)
    async def setRemoteDescription(self, *_, **__):
        pass
    async def createAnswer(self):
        return types.SimpleNamespace(sdp="", type="")
    async def setLocalDescription(self, *_, **__):
        pass
    @property
    def localDescription(self):
        return types.SimpleNamespace(sdp="", type="")
class RTCSessionDescription:  # noqa: D401 - simple stub
    def __init__(self, sdp: str, type: str):
        self.sdp = sdp
        self.type = type
fake_aiortc.RTCPeerConnection = RTCPeerConnection
fake_aiortc.RTCSessionDescription = RTCSessionDescription
sys.modules.setdefault("aiortc", fake_aiortc)

fake_media = types.ModuleType("aiortc.contrib.media")
class MediaRecorder:  # noqa: D401 - simple stub
    def __init__(self, *_, **__):
        pass
    def addTrack(self, *_, **__):
        pass
    async def start(self):
        pass
    async def stop(self):
        pass
fake_media.MediaRecorder = MediaRecorder
sys.modules.setdefault("aiortc.contrib", types.ModuleType("aiortc.contrib"))
sys.modules["aiortc.contrib.media"] = fake_media

import voice.server as vs


def test_voice_recall(monkeypatch):
    """Past utterances should influence subsequent voice replies."""

    stored: list[str] = []

    monkeypatch.setattr(vs, "_load_profile", lambda: {})

    def fake_query_memory(message: str, k: int = 5, exclude_ids=None, min_age_days=None):  # noqa: ARG001
        return [{"text": m} for m in stored]

    monkeypatch.setattr(vs, "query_memory", fake_query_memory)

    def save_memory_sync(text: str, role: str):
        if role == "user":
            stored.append(text)

    monkeypatch.setattr(vs.brain, "_save_memory_async", save_memory_sync)

    vs.brain.process("I love regression tests")
    reply = vs.brain.process("What do I love?")

    assert "I love regression tests" in reply
