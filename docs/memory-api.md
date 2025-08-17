# Memory API

All endpoints in `api/memory.py` require a valid API key.

## Configuration

Set the expected key in the `MEMORY_API_KEY` environment variable before starting the server:

```bash
export MEMORY_API_KEY="your-secret-key"
uvicorn api.memory:app
```

## Usage

Clients must send the same value in the `X-API-Key` header with every request:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:8000/memories
```
