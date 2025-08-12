"""FastAPI application providing a WebRTC `/voice` endpoint."""
from __future__ import annotations

import asyncio
import base64
import json
import tempfile

from fastapi import FastAPI, Request
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRecorder

from core.brain import BrainAgent
from core.metrics import metrics
from .stt import transcribe_audio
from .tts import synthesize_reply

app = FastAPI()


brain = BrainAgent(persona_store=lambda: "", memory_store=lambda _msg: [])


@app.get("/metrics")
async def metrics_endpoint():
    """Expose application metrics including agent call counts."""

    return metrics.as_dict()


@app.post("/voice")
async def voice_endpoint(request: Request):
    """Handle a WebRTC offer from the frontend.

    The client should POST an RTCSessionDescription and will receive an
    answer.  Once the incoming audio track ends, the server transcribes it
    with Whisper and returns a spoken reply over a data channel named
    ``results``.  The reply is sent as base64-encoded WAV audio alongside
    the transcript.
    """
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    recorder_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    recorder = MediaRecorder(recorder_file.name)

    channel = pc.createDataChannel("results")

    @pc.on("track")
    async def on_track(track):
        if track.kind == "audio":
            recorder.addTrack(track)
            await recorder.start()
            await track.recv()  # wait for at least one frame
            await asyncio.sleep(0.1)
            await recorder.stop()
            with open(recorder_file.name, "rb") as f:
                audio_bytes = f.read()
            text = transcribe_audio(audio_bytes)
            reply_text = brain.process(text)
            reply_audio = synthesize_reply(reply_text)
            message = {
                "transcript": text,
                "audio": base64.b64encode(reply_audio).decode(),
            }
            channel.send(json.dumps(message))

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
