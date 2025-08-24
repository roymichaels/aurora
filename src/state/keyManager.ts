let dataKey: Uint8Array | undefined;
let resolveKey: ((key: Uint8Array) => void) | undefined;
const dataKeyPromise = new Promise<Uint8Array>((resolve) => {
  resolveKey = resolve;
});

function decodeSignedMessage(message: string): Uint8Array {
  let normalized = message.trim();
  if (normalized.startsWith('0x') || normalized.startsWith('0X')) {
    normalized = normalized.slice(2);
  }
  if (/^[0-9a-fA-F]+$/.test(normalized)) {
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2) {
      bytes[i / 2] = parseInt(normalized.substring(i, i + 2), 16);
    }
    return bytes;
  }
  try {
    if (typeof atob === 'function') {
      const bin = atob(normalized);
      return Uint8Array.from(bin, (c) => c.charCodeAt(0));
    }
    // @ts-ignore - fallback for node environments
    return Uint8Array.from(Buffer.from(normalized, 'base64'));
  } catch {
    throw new Error('Invalid signed message format');
  }
}

export function setDataKey(key: Uint8Array) {
  dataKey = key;
  resolveKey?.(key);
}

export function clearDataKey() {
  dataKey = undefined;
}

export async function deriveDataKey(signedMessage: string, passcode: string) {
  const messageBytes = decodeSignedMessage(signedMessage);
  const msgHash = new Uint8Array(await crypto.subtle.digest('SHA-256', messageBytes));
  const enc = new TextEncoder();
  const passBytes = enc.encode(passcode);
  const combined = new Uint8Array(msgHash.length + passBytes.length);
  combined.set(msgHash);
  combined.set(passBytes, msgHash.length);
  const baseKey = await crypto.subtle.importKey('raw', combined, 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(await crypto.subtle.digest('SHA-256', passBytes));
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 150_000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );
  const key = new Uint8Array(bits);
  setDataKey(key);
  return key;
}

export function getDataKey() {
  return dataKey;
}

export function waitForDataKey(): Promise<Uint8Array> {
  if (dataKey) {
    return Promise.resolve(dataKey);
  }
  return dataKeyPromise;
}

