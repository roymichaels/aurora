import {
  IndexedDbMemory,
  type MemoryBucket,
  type MemoryEntry,
} from './indexedDbMemory';
import { OpfsMemory } from './opfsStore';

async function createStore() {
  if (
    typeof window !== 'undefined' &&
    'storage' in navigator &&
    typeof (navigator.storage as any).getDirectory === 'function'
  ) {
    try {
      return await OpfsMemory.create();
    } catch {
      return new IndexedDbMemory();
    }
  }
  return new IndexedDbMemory();
}

const memoryStorePromise = createStore();

export async function getMemoryStore() {
  return memoryStorePromise;
}

export interface MemoryRecord {
  id: number;
  text: string;
  metadata: Record<string, any>;
}

export async function saveMemory(
  text: string,
  metadata: Record<string, any> = {},
): Promise<void> {
  const store = await memoryStorePromise;
  await store.add('semantic', metadata.role ?? 'user', text, metadata);
}

export async function queryMemory(
  query: string,
  k = 5,
): Promise<MemoryRecord[]> {
  const store = await memoryStorePromise;
  const results = await store.search(query, k);
  return results.map((m, i) => ({ id: i, text: m.content, metadata: m }));
}

export type { MemoryBucket, MemoryEntry } from './indexedDbMemory';
export { sync } from './sync';
