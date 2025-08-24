import Dexie, { liveQuery, type Table } from 'dexie';

export interface JournalEntry {
  id?: number;
  ts: number;
  text: string;
  mood?: string;
  tags?: string[];
}

class JournalDB extends Dexie {
  journal!: Table<JournalEntry, number>;
}

const db = new JournalDB('aurora-journal');
db.version(1).stores({
  journal: '++id, ts'
});

export const journal = {
  insert(entry: Omit<JournalEntry, 'id'>) {
    return db.journal.add({ ...entry, ts: entry.ts ?? Date.now() });
  },
  find() {
    return {
      sort({ ts }: { ts: 'asc' | 'desc' }) {
        return {
          limit(n: number) {
            const obs$ = liveQuery(() => {
              let coll = db.journal.orderBy('ts');
              if (ts === 'desc') coll = coll.reverse();
              return coll.limit(n).toArray();
            });
            return { $: obs$ } as const;
          }
        };
      }
    };
  }
};

export type { JournalEntry };
