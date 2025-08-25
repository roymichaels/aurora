# Brain Implementation Details

This document outlines how the Personal AI Brain app persists memory, performs recall, and routes requests between local and cloud components.

## Memory Store Schema
- **Purpose:** Persist user conversations, goals, and events.
- **Storage:** SQLite file on device for structured data plus vector index for semantic search.

### Tables
```sql
CREATE TABLE memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    embedding BLOB NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
);
```

### Memory API (pseudocode)
```ts
function storeMemory(text: string) {
  const embedding = embed(text);           // Use local embedding model
  db.run('INSERT INTO memories (content, embedding) VALUES (?, ?)', text, embedding);
}

function recall(query: string) {
  const qEmbed = embed(query);
  return vectorIndex.search('memories', qEmbed, {k:5});
}
```

## Vector Database Choice
- **Local:** [LanceDB](https://lancedb.com) backed by SQLite for fast on-device vector search.
- **Cloud Backup (optional):** A Ton or CouchDB service can mirror the `memories` table when cloud sync is enabled.

```ts
// Sync new memory to cloud when available
if (cloudEnabled) {
  db.from('memories').insert({ content, embedding });
}
```

## Voice Pipeline
1. **STT:** WebRTC stream → Whisper-like local model → text.
2. **Core Brain:** Text routed through agents and memory recall.
3. **TTS:** Response synthesized with a cloned voice model.

```ts
async function handleVoice(stream) {
  const text = await stt.transcribe(stream);
  const reply = await brain.respond(text);
  const audio = await tts.speak(reply);
  play(audio);
}
```

## Local vs Cloud Routing Flow
- **Decision Criteria:** Token limit, model size, latency, and user privacy settings.
- **Router:** Chooses local model first; falls back to cloud for large or complex requests.

```ts
async function route(prompt) {
  if (withinLocalLimits(prompt)) {
    return localLLM.generate(prompt);
  }
  return cloudLLM.generate(prompt, sanitize(prompt));
}
```

