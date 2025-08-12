import { auroraChat } from '@/utils/auroraChat';
// Removed Node crypto usage for browser compatibility

export type MemoryBucket = 'semantic' | 'episodic' | 'procedural';

export interface MemoryEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  embedding: number[];
  mood?: string;
  context?: string;
  confidence?: number;
  tags?: string[];
}

const STORAGE_KEY = 'aurora-memory-store';

let encryptionKey: string | null = null;

export function setMemoryKey(key: string) {
  encryptionKey = key;
}

function encrypt(data: string): string {
  // Simple storage without encryption
  return data;
}

function decrypt(payload: string): string {
  // Return data as-is since no encryption is applied
  return payload;
}

// basic storage wrapper that falls back to in-memory store when localStorage is unavailable
const memoryStorage: Storage = typeof window !== 'undefined' && window.localStorage
  ? window.localStorage
  : {
      _data: {} as Record<string, string>,
      getItem(key: string) {
        return (this._data as Record<string, string>)[key] ?? null;
      },
      setItem(key: string, value: string) {
        (this._data as Record<string, string>)[key] = value;
      },
      removeItem(key: string) {
        delete (this._data as Record<string, string>)[key];
      },
      clear() {
        this._data = {};
      },
      key(i: number) {
        return Object.keys(this._data)[i] ?? null;
      },
      get length() {
        return Object.keys(this._data).length;
      },
    } as Storage;

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

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const { content } = await auroraChat(
      [
        {
          role: 'system',
          content:
            'You are an embedding service. Return a JSON array of numbers representing the embedding of the user text.',
        },
        { role: 'user', content: text },
      ],
      { model: 'embedding' }
    );
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed.map((n: any) => Number(n));
  } catch (e) {
    // fall back to simple deterministic embedding when auroraChat is unavailable
    return Array.from(text).map((c) => c.charCodeAt(0) / 255);
  }
  return [];
}

export class IndexedDbMemory {
  private memories: Record<MemoryBucket, MemoryEntry[]> = {
    semantic: [],
    episodic: [],
    procedural: [],
  };

  constructor() {
    this.memories = this.load();
  }

  private load(): Record<MemoryBucket, MemoryEntry[]> {
    try {
      const raw = memoryStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(decrypt(raw)) : {};
      return {
        semantic: data.semantic ?? [],
        episodic: data.episodic ?? [],
        procedural: data.procedural ?? [],
      };
    } catch {
      return { semantic: [], episodic: [], procedural: [] };
    }
  }

  private persist() {
    try {
      const data = JSON.stringify(this.memories);
      memoryStorage.setItem(STORAGE_KEY, encrypt(data));
    } catch {
      // ignore
    }
  }

  private async prune(bucket: MemoryBucket, limit = 200) {
    if (this.memories[bucket].length > limit) {
      const excess = this.memories[bucket].splice(
        0,
        this.memories[bucket].length - limit,
      );
      if (excess.length) {
        const summaryText = excess
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n');
        const embedding = await getEmbedding(summaryText);
        this.memories.semantic.push({
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: summaryText,
          timestamp: Date.now(),
          embedding,
          tags: ["summary", bucket],
        });
        if (this.memories.semantic.length > limit) {
          this.memories.semantic = this.memories.semantic.slice(-limit);
        }
      }
    }
  }

  importAll(data: Record<MemoryBucket, MemoryEntry[]>) {
    this.memories = {
      semantic: data.semantic ?? [],
      episodic: data.episodic ?? [],
      procedural: data.procedural ?? [],
    };
    this.persist();
  }

  async add(
    bucket: MemoryBucket,
    role: 'user' | 'assistant',
    content: string,
    meta: { mood?: string; context?: string; confidence?: number; tags?: string[] } = {}
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
    this.persist();
  }

  list(bucket: MemoryBucket) {
    return [...this.memories[bucket]];
  }

  async update(
    bucket: MemoryBucket,
    id: string,
    updates: {
      content?: string;
      mood?: string;
      context?: string;
      confidence?: number;
      tags?: string[];
    },
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
    this.persist();
  }

  delete(bucket: MemoryBucket, id: string) {
    this.memories[bucket] = this.memories[bucket].filter((m) => m.id !== id);
    this.persist();
  }

  async search(
    text: string,
    topK = 5,
    bucket?: MemoryBucket,
    tags: string[] = []
  ): Promise<MemoryEntry[]> {
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
    const scored = candidates.map((m) => ({
      m,
      score: cosineSimilarity(query, m.embedding),
    }));
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

export const memoryStore = new IndexedDbMemory();

export async function retrieveRelevantMemories(
  text: string,
  k = 5,
  bucket?: MemoryBucket,
  tags: string[] = []
) {
  return memoryStore.search(text, k, bucket, tags);
}

