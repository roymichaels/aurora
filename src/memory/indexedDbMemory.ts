import { auroraChat } from '@/utils/auroraChat';

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
      const parsed = raw ? (JSON.parse(raw) as Record<string, MemoryEntry[]>) : {};
      return {
        semantic: parsed.semantic ?? [],
        episodic: parsed.episodic ?? [],
        procedural: parsed.procedural ?? [],
      };
    } catch {
      return { semantic: [], episodic: [], procedural: [] };
    }
  }

  private persist() {
    try {
      memoryStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
    } catch {
      // ignore
    }
  }

  private prune(bucket: MemoryBucket, limit = 200) {
    if (this.memories[bucket].length > limit) {
      this.memories[bucket] = this.memories[bucket].slice(-limit);
    }
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
    this.prune(bucket);
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

