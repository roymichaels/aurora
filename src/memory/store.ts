import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PY = path.resolve(__dirname, '../../memory/store.py');

export interface MemoryRecord {
  id: number;
  text: string;
  metadata: Record<string, any>;
}

export async function saveMemory(text: string, metadata: Record<string, any> = {}): Promise<void> {
  try {
    await execFileAsync('python', [STORE_PY, 'save', text, JSON.stringify(metadata)]);
  } catch (e) {
    console.error('saveMemory failed', e);
  }
}

export async function queryMemory(query: string, k = 5): Promise<MemoryRecord[]> {
  try {
    const { stdout } = await execFileAsync('python', [STORE_PY, 'query', query, String(k)]);
    return JSON.parse(stdout || '[]');
  } catch (e) {
    console.error('queryMemory failed', e);
    return [];
  }
}
