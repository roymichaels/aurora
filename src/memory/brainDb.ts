import initSqlJs, { Database } from "sql.js";

const DB_FILE = "brain.db";
const IDB_NAME = "brain-db";
const IDB_STORE = "files";
const SALT_LEN = 16;
const IV_LEN = 12;

export interface BrainDatabase extends Database {
  saveToDisk(): Promise<void>;
}

let cachedDb: BrainDatabase | null = null;

function getEncryptionSettings() {
  if (typeof localStorage === "undefined") {
    return { enabled: false, passphrase: "" };
  }
  try {
    const enabled = JSON.parse(
      localStorage.getItem("brain.encrypt.enabled") || "false",
    ) as boolean;
    const passphrase = JSON.parse(
      localStorage.getItem("brain.backup.passphrase") || '""',
    ) as string;
    return { enabled, passphrase };
  } catch {
    return { enabled: false, passphrase: "" };
  }
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptData(data: Uint8Array, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(passphrase, salt);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data),
  );
  const out = new Uint8Array(salt.length + iv.length + encrypted.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(encrypted, salt.length + iv.length);
  return out;
}

async function decryptData(data: Uint8Array, passphrase: string) {
  if (data.length < SALT_LEN + IV_LEN) throw new Error("Invalid data");
  const salt = data.slice(0, SALT_LEN);
  const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const enc = data.slice(SALT_LEN + IV_LEN);
  const key = await deriveKey(passphrase, salt);
  const decrypted = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, enc),
  );
  return decrypted;
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
  if (cachedDb) return cachedDb;
  try {
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        new URL(`../../node_modules/sql.js/dist/${file}`, import.meta.url).toString(),
    });

    let opfsHandle: FileSystemFileHandle | null = null;
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).storage?.getDirectory
    ) {
      try {
        const root = await (navigator as any).storage.getDirectory();
        opfsHandle = await root.getFileHandle(DB_FILE, { create: true });
      } catch {
        opfsHandle = null;
      }
    }

    let db: BrainDatabase;
    if (opfsHandle) {
      try {
        const file = await opfsHandle.getFile();
        let buffer = new Uint8Array(await file.arrayBuffer());
        const { passphrase } = getEncryptionSettings();
        if (passphrase && buffer.byteLength) {
          try {
            buffer = await decryptData(buffer, passphrase);
          } catch {}
        }
        db = buffer.byteLength
          ? (new SQL.Database(buffer) as BrainDatabase)
          : (new SQL.Database() as BrainDatabase);
      } catch {
        db = new SQL.Database() as BrainDatabase;
      }
    } else {
      let bytes = await idbGet(DB_FILE);
      const { passphrase } = getEncryptionSettings();
      if (bytes && passphrase) {
        try {
          bytes = await decryptData(bytes, passphrase);
        } catch {}
      }
      db = bytes
        ? (new SQL.Database(bytes) as BrainDatabase)
        : (new SQL.Database() as BrainDatabase);
    }

    db.saveToDisk = async () => {
      let data = db.export();
      const { enabled, passphrase } = getEncryptionSettings();
      if (enabled && passphrase) {
        data = await encryptData(data, passphrase);
      }
      if (opfsHandle) {
        try {
          const writable = await opfsHandle.createWritable();
          await writable.write(data);
          await writable.close();
        } catch {
          // fall back to IndexedDB if OPFS write fails
          await idbSet(DB_FILE, data);
        }
      } else {
        await idbSet(DB_FILE, data);
        // try to sync to OPFS if it becomes available later
        if (
          typeof navigator !== "undefined" &&
          (navigator as any).storage?.getDirectory
        ) {
          try {
            const root = await (navigator as any).storage.getDirectory();
            opfsHandle = await root.getFileHandle(DB_FILE, { create: true });
            const writable = await opfsHandle.createWritable();
            await writable.write(data);
            await writable.close();
          } catch {
            // ignore sync errors
          }
        }
      }
    };

    cachedDb = db;
    return db;
  } catch (e) {
    console.error("Failed to open brain database", e);
    throw e;
  }
}

export async function closeBrainDb(): Promise<void> {
  if (!cachedDb) return;
  try {
    await cachedDb.saveToDisk();
  } catch (e) {
    console.error("Failed to save brain database", e);
  }
  try {
    cachedDb.close();
  } catch (e) {
    console.error("Failed to close brain database", e);
  }
  cachedDb = null;
}

