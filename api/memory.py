from __future__ import annotations

import os

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel

from memory.store import delete_memory, list_memories, save_memory, update_memory


def verify_api_key(x_api_key: str | None = Header(None, alias="X-API-Key")) -> None:
    """Ensure the provided API key matches the configured value."""
    expected = os.getenv("MEMORY_API_KEY")
    if expected is None or x_api_key != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


app = FastAPI(dependencies=[Depends(verify_api_key)])


class Memory(BaseModel):
    text: str
    metadata: dict | None = None


class MemoryResponse(Memory):
    id: int


@app.get("/memories", response_model=list[MemoryResponse])
def get_memories():
    """Return all stored memories."""
    return [MemoryResponse(**m) for m in list_memories()]


@app.post("/memories", response_model=MemoryResponse)
def create_memory(payload: Memory):
    mem_id = save_memory(payload.text, payload.metadata)
    return MemoryResponse(id=mem_id, text=payload.text, metadata=payload.metadata or {})


@app.put("/memories/{mem_id}", response_model=MemoryResponse)
def update_memory_endpoint(mem_id: int, payload: Memory):
    updated = update_memory(mem_id, payload.text, payload.metadata)
    if not updated:
        raise HTTPException(status_code=404, detail="Memory not found")
    return MemoryResponse(id=mem_id, text=payload.text, metadata=payload.metadata or {})


@app.delete("/memories/{mem_id}")
def delete_memory_endpoint(mem_id: int):
    if not delete_memory(mem_id):
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "ok"}
