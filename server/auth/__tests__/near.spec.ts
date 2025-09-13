import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import * as nacl from 'tweetnacl';
import type { Response as LightMyRequestResponse } from 'light-my-request';
import nearAuth, { composeMessage } from '../near';

function toBase64(buf: Uint8Array): string {
  return Buffer.from(buf).toString('base64');
}

function getCookie(res: LightMyRequestResponse, name: string) {
  const raw = res.headers['set-cookie'];
  const header = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const c of header) {
    const [head, ...parts] = c.split(';').map((p) => p.trim());
    const [cookieName, cookieValue] = head.split('=');
    if (cookieName !== name) continue;
    const cookie: any = { name: cookieName, value: cookieValue };
    for (const part of parts) {
      const [k, v] = part.split('=');
      const key = k.toLowerCase();
      if (key === 'httponly') cookie.httpOnly = true;
      else if (key === 'secure') cookie.secure = true;
      else if (key === 'samesite') cookie.sameSite = v;
      else if (key === 'expires') cookie.expires = new Date(v);
    }
    return cookie;
  }
  return undefined;
}

describe('NEAR auth', () => {
  let app: FastifyInstance;
  let keypair: nacl.SignKeyPair;

  beforeEach(async () => {
    app = fastify({ trustProxy: true });
    await app.register(cookie);
    await app.register(nearAuth);
    await app.ready();
    keypair = nacl.sign.keyPair();
  });

  afterEach(async () => {
    await app.close();
  });

  test('verifies signature and sets cookie', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/near/start' });
    const { challenge } = start.json();
    const scopes: string[] = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toBase64(nacl.sign.detached(new TextEncoder().encode(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/near/verify',
      payload: {
        publicKey: toBase64(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(200);
    const cookie = getCookie(res as LightMyRequestResponse, 'sid');
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe('Lax');
    expect(cookie!.secure).toBeUndefined();
  });

  test('clears cookie on logout', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' });
    const cookie = getCookie(res as LightMyRequestResponse, 'sid');
    expect(cookie).toBeDefined();
    expect(cookie!.expires.valueOf()).toBeLessThan(Date.now());
  });
});
