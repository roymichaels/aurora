import { getEmbedding, type MemoryBucket, type MemoryEntry } from './indexedDbMemory';

const FILE_NAME = 'aurora-memory.json';

async function getFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const root = await (navigator.storage as any).getDirectory();
    return await root.getFileHandle(FILE_NAME, { create: true });
  } catch {
    return null;
  }
}

async function read(handle: FileSystemFileHandle): Promise<any> {
  try {
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text || '{}');
  } catch {
    return {};
  }
}

async function write(handle: FileSystemFileHandle, data: string) {
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

export class OpfsMemory {
  private memories: Record<MemoryBucket, MemoryEntry[]> = {
    semantic: [],
    episodic: [],
    procedural: [],
  };
  private handle: FileSystemFileHandle | null = null;

  private constructor(handle: FileSystemFileHandle | null, data: Record<MemoryBucket, MemoryEntry[]>) {
    this.handle = handle;
    this.memories = data;
  }

  static async create() {
    const handle = await getFileHandle();
    const data = handle ? await read(handle) : {};
    return new OpfsMemory(handle, {
      semantic: data.semantic ?? [],
      episodic: data.episodic ?? [],
      procedural: data.procedural ?? [],
    });
  }

  private async persist() {
    if (!this.handle) return;
    await write(this.handle, JSON.stringify(this.memories));
  }

  importAll(data: Record<MemoryBucket, MemoryEntry[]>) {
    this.memories = {
      semantic: data.semantic ?? [],
      episodic: data.episodic ?? [],
      procedural: data.procedural ?? [],
    };
    void this.persist();
  }

  list(bucket: MemoryBucket) {
    return [...this.memories[bucket]];
  }

  async add(
    bucket: MemoryBucket,
    role: 'user' | 'assistant',
    content: string,
    meta: { mood?: string; context?: string; confidence?: number; tags?: string[] } = {},
  ) {
    const embedding = await getEmbedding(content);
    this.memories[bucket].push({
      id: Math.random().toString(36).slice(2),
      role,
      content,
      timestamp: Date.now(),
      embedding,
      mood: meta.mood,
      context: meta.context,
      confidence: meta.confidence,
      tags: meta.tags,
    });
    await this.prune(bucket);
    await this.persist();
  }

  private async prune(bucket: MemoryBucket, limit = 200) {
    if (this.memories[bucket].length > limit) {
      this.memories[bucket] = this.memories[bucket].slice(-limit);
    }
  }

  async update(
    bucket: MemoryBucket,
    id: string,
    updates: { content?: string; mood?: string; context?: string; confidence?: number; tags?: string[] },
  ) {
    const entry = this.memories[bucket].find((m) => m.id === id);
    if (!entry) return;
    if (updates.content && updates.content !== entry.content) {
      entry.content = updates.content;
      entry.embedding = await getEmbedding(entry.content);
    }
    if (updates.mood !== undefined) entry.mood = updates.mood;
    if (updates.context !== undefined) entry.context = updates.context;
    if (updates.confidence !== undefined) entry.confidence = updates.confidence;
    if (updates.tags !== undefined) entry.tags = updates.tags;
    await this.persist();
  }

  delete(bucket: MemoryBucket, id: string) {
    this.memories[bucket] = this.memories[bucket].filter((m) => m.id !== id);
    void this.persist();
  }

  async search(text: string, topK = 5, bucket?: MemoryBucket, tags: string[] = []): Promise<MemoryEntry[]> {
    const pool = bucket
      ? this.memories[bucket]
      : [...this.memories.semantic, ...this.memories.episodic, ...this.memories.procedural];
    let candidates = pool;
    if (!candidates.length) return [];
    if (tags.length) {
      candidates = candidates.filter((m) => tags.every((t) => m.tags?.includes(t)));
      if (!candidates.length) return [];
    }
    const query = await getEmbedding(text);
    const scored = candidates.map((m) => ({ m, score: cosineSimilarity(query, m.embedding) }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.m);
  }

  exportAll() {
    return {
      semantic: [...this.memories.semantic],
      episodic: [...this.memories.episodic],
      procedural: [...this.memories.procedural],
    };
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
