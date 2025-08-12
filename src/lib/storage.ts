// Remove Node crypto usage for browser compatibility

interface SaveProfileInput {
  userId: string;
  password: string;
  [key: string]: unknown;
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

const globalWithStorage = globalThis as { localStorage?: StorageLike };
const storage: StorageLike =
  typeof globalThis !== "undefined" && globalWithStorage.localStorage
    ? globalWithStorage.localStorage
    : createMemoryStorage();

export function saveProfile(profile: SaveProfileInput): void {
  const { userId, password: _password, ...data } = profile;
  // Store profile directly without encryption
  storage.setItem(
    STORAGE_PREFIX + userId,
    JSON.stringify({ userId, ...data }),
  );
}

export function loadProfile(
  userId: string,
  password: string,
): Record<string, unknown> | null {
  const raw = storage.getItem(STORAGE_PREFIX + userId);
  if (!raw) return null;
  // Simply parse stored JSON
  return JSON.parse(raw) as Record<string, unknown>;
}

export function exportProfile(userId: string): string | null {
  return storage.getItem(STORAGE_PREFIX + userId);
}

export function deleteProfile(userId: string): void {
  storage.removeItem?.(STORAGE_PREFIX + userId);
}

