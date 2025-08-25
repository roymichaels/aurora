import { openBrainDb, __setMemoryDb, type BrainDatabase } from './brainDb';
import { toast } from '@/hooks/use-toast';

const DB_FILE = 'brain.db';

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function exportEncryptedBrain(passphrase: string): Promise<ArrayBuffer> {
  const db: BrainDatabase = await openBrainDb();
  await db.saveToDisk();
  const data = db.export();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data.buffer)
  );
  const out = new Uint8Array(salt.length + iv.length + encrypted.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(encrypted, salt.length + iv.length);
  return out.buffer;
}

async function writeBrain(bytes: Uint8Array) {
  const hasOpfs =
    typeof navigator !== 'undefined' && !!(navigator as any).storage?.getDirectory;
  if (hasOpfs) {
    try {
      const root = await (navigator as any).storage.getDirectory();
      const handle = await root.getFileHandle(DB_FILE, { create: true });
      const writable = await handle.createWritable();
      await writable.write(bytes);
      await writable.close();
      return;
    } catch {
      toast({ title: 'Storage error', description: 'OPFS write failed' });
    }
  }
  if (typeof indexedDB !== 'undefined') {
    try {
      const dbReq = indexedDB.open('brain-db', 1);
      await new Promise<void>((resolve, reject) => {
        dbReq.onupgradeneeded = () => dbReq.result.createObjectStore('files');
        dbReq.onsuccess = () => resolve();
        dbReq.onerror = () => reject(dbReq.error);
      });
      const db = dbReq.result;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        const req = tx.objectStore('files').put(bytes, DB_FILE);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return;
    } catch {
      toast({ title: 'Storage error', description: 'IndexedDB write failed' });
    }
  } else {
    toast({ title: 'Storage unavailable', description: 'IndexedDB not supported' });
  }
  __setMemoryDb(bytes);
}

export async function importEncryptedBrain(buffer: ArrayBuffer, passphrase: string) {
  const buf = new Uint8Array(buffer);
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const data = buf.slice(28);
  const key = await deriveKey(passphrase, salt);
  const decrypted = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data.buffer)
  );
  await writeBrain(decrypted);
}
