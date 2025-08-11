import { memoryStore } from '@/memory/indexedDbMemory';
import { loadProfile } from '@/data/profile';
import type { MemoryEntry } from '@/memory/indexedDbMemory';

export interface TrainingData {
  transcripts: string[];
  personaNotes: string[];
}

function isApproved(entry: MemoryEntry): boolean {
  return entry.tags?.includes('approved') ?? false;
}

export function gatherApprovedTranscripts(): string[] {
  return memoryStore
    .list('episodic')
    .filter((m) => m.role === 'user' && isApproved(m))
    .map((m) => m.content);
}

export function gatherPersonaNotes(): string[] {
  const profile = loadProfile();
  if (!profile) return [];
  const fields: (keyof typeof profile)[] = [
    'goals',
    'values',
    'skills',
    'habits',
    'challenges',
    'tones',
    'quirks',
  ];
  const notes: string[] = [];
  for (const f of fields) {
    const v = profile[f];
    if (typeof v === 'string' && v.trim()) notes.push(v);
  }
  return notes;
}

export function gatherTrainingData(): TrainingData {
  return {
    transcripts: gatherApprovedTranscripts(),
    personaNotes: gatherPersonaNotes(),
  };
}

export async function fineTuneLocalLoRA(outputDir = 'local-model') {
  const data = gatherTrainingData();
  const fs = await import('fs/promises');
  const path = await import('path');
  await fs.mkdir(outputDir, { recursive: true });
  const datasetPath = path.join(outputDir, 'training_data.json');
  await fs.writeFile(datasetPath, JSON.stringify(data, null, 2));

  const { spawn } = await import('child_process');
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('python', ['scripts/fine_tune_lora.py', datasetPath, outputDir], {
      stdio: 'inherit',
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`fine-tune failed: ${code}`));
    });
  });
}
