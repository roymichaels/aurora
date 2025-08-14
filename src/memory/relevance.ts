import type { MemoryEntry } from './indexedDbMemory';
import type { MemoryRecord } from './store';

export interface AnnotatedMemory {
  role: string;
  content: string;
  score?: number;
  why: string;
}

function explainRelevance(query: string, content: string): string {
  const qWords = new Set(query.toLowerCase().split(/\W+/).filter(Boolean));
  const words = content.toLowerCase().split(/\W+/).filter(Boolean);
  const match = words.find(w => qWords.has(w));
  return match ? `Mentions "${match}"` : 'Semantically related';
}

export function mergeAndExplainMemories(
  query: string,
  memories: MemoryEntry[],
  longTerm: MemoryRecord[],
  max = 5
): { annotated: AnnotatedMemory[]; recall: string | null } {
  const combined = [
    ...memories.map(m => ({
      role: m.role,
      content: m.content,
      score: (m as any).score ?? (m as any).confidence,
    })),
    ...longTerm.map(m => ({
      role: m.metadata?.role ?? 'memory',
      content: m.text,
      score: (m as any).score ?? (m.metadata as any)?.score,
    })),
  ];
  combined.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = combined.slice(0, max);
  const annotated = top.map(m => ({ ...m, why: explainRelevance(query, m.content) }));
  return { annotated, recall: annotated[0]?.why ?? null };
}

export function formatMemoryContext(list: AnnotatedMemory[]): string {
  return list
    .map(m => `${m.role}: ${m.content} (Why recalled: ${m.why})`)
    .join('\n');
}
