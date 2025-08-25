import type { MemoryBucket, MemoryEntry } from './indexedDbMemory';
import { retryWithBackoff } from '@/utils/retry';
import * as Y from 'yjs';

export interface SyncAdapter {
  pull(): Promise<Record<MemoryBucket, MemoryEntry[]>>;
  push(data: Record<MemoryBucket, MemoryEntry[]>): Promise<void>;
}

export function resolveConflicts(
  local: MemoryEntry[],
  remote: MemoryEntry[],
): MemoryEntry[] {
  const map = new Map<string, MemoryEntry>();
  for (const entry of [...local, ...remote]) {
    const existing = map.get(entry.id);
    if (!existing || existing.timestamp < entry.timestamp) {
      map.set(entry.id, entry);
    }
  }
  return Array.from(map.values());
}

function docFromRecord(data: Record<MemoryBucket, MemoryEntry[]>): Y.Doc {
  const doc = new Y.Doc();
  const root = doc.getMap('mem');
  (['semantic', 'episodic', 'procedural'] as MemoryBucket[]).forEach((bucket) => {
    const map = new Y.Map<MemoryEntry>();
    (data[bucket] || []).forEach((entry) => map.set(entry.id, entry));
    root.set(bucket, map);
  });
  return doc;
}

function recordFromDoc(doc: Y.Doc): Record<MemoryBucket, MemoryEntry[]> {
  const root = doc.getMap('mem');
  const result: Record<MemoryBucket, MemoryEntry[]> = {
    semantic: [],
    episodic: [],
    procedural: [],
  };
  (['semantic', 'episodic', 'procedural'] as MemoryBucket[]).forEach((bucket) => {
    const map = root.get(bucket) as Y.Map<MemoryEntry> | undefined;
    if (map) {
      map.forEach((entry) => {
        result[bucket].push(entry);
      });
    }
  });
  return result;
}

function merge(
  local: Record<MemoryBucket, MemoryEntry[]>,
  remote: Record<MemoryBucket, MemoryEntry[]>,
): Record<MemoryBucket, MemoryEntry[]> {
  const docLocal = docFromRecord(local);
  const updateRemote = Y.encodeStateAsUpdate(docFromRecord(remote));
  Y.applyUpdate(docLocal, updateRemote);
  return recordFromDoc(docLocal);
}

export async function sync(adapter: SyncAdapter) {
  const [{ getMemoryStore }, { default: logger }] = await Promise.all([
    import('./store'),
    import('@/lib/logger'),
  ]);
  const memoryStore = await getMemoryStore();
  const remote = await adapter.pull();
  const local = memoryStore.exportAll();
  const merged = merge(local, remote);
  memoryStore.importAll(merged);
  await adapter.push(merged);
  logger.info({
    event: 'memory_sync',
    localCounts: {
      semantic: local.semantic.length,
      episodic: local.episodic.length,
      procedural: local.procedural.length,
    },
    remoteCounts: {
      semantic: remote.semantic.length,
      episodic: remote.episodic.length,
      procedural: remote.procedural.length,
    },
    mergedCounts: {
      semantic: merged.semantic.length,
      episodic: merged.episodic.length,
      procedural: merged.procedural.length,
    },
  });
}

export class CloudSyncAdapter implements SyncAdapter {
  constructor(private endpoint: string) {}

  async pull() {
    try {
      const res = await retryWithBackoff(() => fetch(this.endpoint));
      if (!res.ok) throw new Error('failed');
      return (await res.json()) as Record<MemoryBucket, MemoryEntry[]>;
    } catch {
      return { semantic: [], episodic: [], procedural: [] };
    }
  }

  async push(data: Record<MemoryBucket, MemoryEntry[]>) {
    try {
      await retryWithBackoff(() =>
        fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      );
    } catch {
      // ignore
    }
  }
}

export class PeerSyncAdapter implements SyncAdapter {
  constructor(private channel: RTCDataChannel) {}

  pull(): Promise<Record<MemoryBucket, MemoryEntry[]>> {
    return new Promise((resolve) => {
      const handler = (ev: MessageEvent) => {
        this.channel.removeEventListener('message', handler);
        resolve(JSON.parse(ev.data));
      };
      this.channel.addEventListener('message', handler);
      this.channel.send('pull');
    });
  }

  async push(data: Record<MemoryBucket, MemoryEntry[]>) {
    this.channel.send(JSON.stringify(data));
  }
}
