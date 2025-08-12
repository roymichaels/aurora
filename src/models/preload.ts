const MODEL_FILES = [
  { key: 'llm', path: '/models/llm.bin' },
  { key: 'stt', path: '/models/stt.bin' },
  { key: 'tts', path: '/models/tts.bin' },
];

async function cacheModel(key: string, path: string): Promise<void> {
  const storageKey = `aurora_model_${key}`;
  if (typeof window === 'undefined' || localStorage.getItem(storageKey)) {
    return;
  }
  try {
    const res = await fetch(path);
    const buf = await res.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    localStorage.setItem(storageKey, base64);
  } catch {
    // ignore fetch/cache errors
  }
}

export async function preloadLocalModels(): Promise<void> {
  await Promise.all(MODEL_FILES.map((m) => cacheModel(m.key, m.path)));
}
