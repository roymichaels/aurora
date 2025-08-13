import type { MemoryBucket, MemoryEntry } from './indexedDbMemory';
import { retryWithBackoff } from '@/utils/retry';

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

function merge(
  local: Record<MemoryBucket, MemoryEntry[]>,
  remote: Record<MemoryBucket, MemoryEntry[]>,
): Record<MemoryBucket, MemoryEntry[]> {
  return {
    semantic: resolveConflicts(local.semantic || [], remote.semantic || []),
    episodic: resolveConflicts(local.episodic || [], remote.episodic || []),
    procedural: resolveConflicts(local.procedural || [], remote.procedural || []),
  };
}

export async function syncWithAdapter(adapter: SyncAdapter) {
  const { memoryStore } = await import('./indexedDbMemory');
  const remote = await adapter.pull();
  const local = memoryStore.exportAll();
  const merged = merge(local, remote);
  memoryStore.importAll(merged);
  await adapter.push(merged);
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

