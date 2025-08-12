import { resolveConflicts } from './sync';
import type { MemoryEntry } from './indexedDbMemory';

describe('resolveConflicts', () => {
  it('prefers newer entries and merges unique ones', () => {
    const local: MemoryEntry[] = [
      { id: '1', role: 'user', content: 'old', timestamp: 1, embedding: [] },
      { id: '2', role: 'user', content: 'local', timestamp: 2, embedding: [] },
    ];
    const remote: MemoryEntry[] = [
      { id: '1', role: 'user', content: 'new', timestamp: 5, embedding: [] },
      { id: '3', role: 'user', content: 'remote', timestamp: 1, embedding: [] },
    ];
    const merged = resolveConflicts(local, remote);
    const byId = Object.fromEntries(merged.map((m) => [m.id, m]));
    expect(byId['1'].content).toBe('new');
    expect(byId['2'].content).toBe('local');
    expect(byId['3'].content).toBe('remote');
  });
});
