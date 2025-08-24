let dataKey: Uint8Array | undefined;

export async function deriveDataKey(signedMessage: string, passcode: string) {
  const enc = new TextEncoder();
  const combined = enc.encode(`${signedMessage}${passcode}`);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey('raw', combined, 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 150_000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  dataKey = new Uint8Array(raw);
  return dataKey;
}

export function getDataKey() {
  return dataKey;
}
