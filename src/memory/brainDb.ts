import initSqlJs, { Database } from "sql.js";

const DB_FILE = "brain.db";
const IDB_NAME = "brain-db";
const IDB_STORE = "files";

export interface BrainDatabase extends Database {
  saveToDisk(): Promise<void>;
}

async function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => {
      const result = req.result as ArrayBuffer | undefined;
      resolve(result ? new Uint8Array(result) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: Uint8Array): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function openBrainDb(): Promise<BrainDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      new URL(`../../node_modules/sql.js/dist/${file}`, import.meta.url).toString(),
  });

  const hasOpfs =
    typeof navigator !== "undefined" &&
    !!(navigator as any).storage?.getDirectory;

  if (hasOpfs) {
    const root = await (navigator as any).storage.getDirectory();
    const handle = await root.getFileHandle(DB_FILE, { create: true });
    let db: BrainDatabase;
    try {
      const file = await handle.getFile();
      const buffer = await file.arrayBuffer();
      db = buffer.byteLength
        ? (new SQL.Database(new Uint8Array(buffer)) as BrainDatabase)
        : (new SQL.Database() as BrainDatabase);
    } catch {
      db = new SQL.Database() as BrainDatabase;
    }
    db.saveToDisk = async () => {
      const data = db.export();
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    };
    return db;
  }

  const bytes = await idbGet(DB_FILE);
  const db = bytes
    ? (new SQL.Database(bytes) as BrainDatabase)
    : (new SQL.Database() as BrainDatabase);
  db.saveToDisk = async () => {
    const data = db.export();
    await idbSet(DB_FILE, data);
  };
  return db;
}

