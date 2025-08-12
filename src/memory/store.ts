// Node-specific memory store that delegates to a Python script.
// These utilities are loaded dynamically so the module can be imported in
// browser environments without bundling Node built-ins.
async function runStorePy(args: string[]) {
  if (typeof window !== 'undefined') return null;
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const execFileAsync = promisify(execFile);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const STORE_PY = path.resolve(__dirname, '../../memory/store.py');
  return execFileAsync('python', [STORE_PY, ...args]);
}

export interface MemoryRecord {
  id: number;
  text: string;
  metadata: Record<string, any>;
}

export async function saveMemory(text: string, metadata: Record<string, any> = {}): Promise<void> {
  try {
    await runStorePy(['save', text, JSON.stringify(metadata)]);
  } catch (e) {
    console.error('saveMemory failed', e);
  }
}

export async function queryMemory(query: string, k = 5): Promise<MemoryRecord[]> {
  try {
    const result = await runStorePy(['query', query, String(k)]);
    if (!result) return [];
    const stdout = (result as any).stdout ?? '';
    return JSON.parse(stdout || '[]');
  } catch (e) {
    console.error('queryMemory failed', e);
    return [];
  }
}
