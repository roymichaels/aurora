import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "crypto";

interface SaveProfileInput {
  userId: string;
  password: string;
  [key: string]: any;
}

interface StoredPayload {
  salt: string;
  iv: string;
  tag: string;
  data: string;
}

const STORAGE_PREFIX = "profile:";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
  clear?(): void;
}

const createMemoryStorage = (): StorageLike => {
  const store: Record<string, string> = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
};

const storage: StorageLike =
  typeof globalThis !== "undefined" && (globalThis as any).localStorage
    ? (globalThis as any).localStorage
    : createMemoryStorage();

export function saveProfile(profile: SaveProfileInput): void {
  const { userId, password, ...data } = profile;
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify({ userId, ...data }), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: StoredPayload = {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64"),
  };

  storage.setItem(STORAGE_PREFIX + userId, JSON.stringify(payload));
}

export function loadProfile(userId: string, password: string): any | null {
  const raw = storage.getItem(STORAGE_PREFIX + userId);
  if (!raw) return null;

  const payload: StoredPayload = JSON.parse(raw);
  const salt = Buffer.from(payload.salt, "base64");
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");

  const key = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

export function exportProfile(userId: string): string | null {
  return storage.getItem(STORAGE_PREFIX + userId);
}

export function deleteProfile(userId: string): void {
  storage.removeItem?.(STORAGE_PREFIX + userId);
}

