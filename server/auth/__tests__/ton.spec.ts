import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import { jwtVerify } from 'jose';
import type { LightMyRequestResponse } from 'light-my-request';
import tonAuth, { composeMessage } from '../ton';

import type TonWeb from 'tonweb';
import type { SignKeyPair } from 'tweetnacl';

type TonUtils = typeof TonWeb.utils;
let nacl: TonUtils['nacl'];
let bytesToHex: TonUtils['bytesToHex'];
let stringToBytes: TonUtils['stringToBytes'];



function toHex(buf: Uint8Array): string {
  return bytesToHex(buf);
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

describe('TON auth', () => {
  let app: FastifyInstance;
  let keypair: SignKeyPair;
  const secretBytes = new TextEncoder().encode('secret');

  beforeAll(async () => {
    const TonWebMod = (await import('tonweb')).default;
    ({ nacl, bytesToHex, stringToBytes } = TonWebMod.utils);
  });

  beforeEach(async () => {
    app = fastify({ trustProxy: true });
    await app.register(cookie);
    await app.register(tonAuth);
    await app.ready();
    keypair = nacl.sign.keyPair();
  });

  afterEach(async () => {
    await app.close();
  });

  test('sets cookie attributes over HTTP', async () => {
    const start: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/start',
    });
    const { challenge } = start.json();
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(200);
    const cookie = getCookie(res, 'sid');
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe('Lax');
    expect(cookie!.secure).toBeUndefined();
  });

  test('sets secure cookie over HTTPS', async () => {
    const start: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/start',
    });
    const { challenge } = start.json();
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(res.statusCode).toBe(200);
    const cookie = getCookie(res, 'sid');
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe('Lax');
    expect(cookie!.secure).toBe(true);
  });

  test('clears cookie on logout', async () => {
    const start: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/start',
    });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const login: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes: [],
        signature: sig,
      },
      headers: { 'x-forwarded-proto': 'https' },
    });
    const token = getCookie(login, 'sid');
    expect(token).toBeDefined();

    const res: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { sid: token!.value },
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    const cleared = getCookie(res, 'sid');
    expect(cleared).toBeDefined();
    expect(cleared!.value).toBe('');
    expect(cleared!.expires.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(cleared!.secure).toBe(true);
  });

  test('rejects replayed challenges', async () => {
    const start: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/start',
    });
    const { challenge, ttl } = start.json();
    expect(ttl).toBe(120);
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res: LightMyRequestResponse = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(200);
    const tokenCookie = getCookie(res, 'sid');
    expect(tokenCookie).toBeDefined();
    const { payload: tokenPayload } = await jwtVerify(
      tokenCookie!.value,
      secretBytes,
    );
    expect(tokenPayload.sub).toBe(toHex(keypair.publicKey));
    expect(tokenPayload.scopes).toEqual(scopes);
  });

  test('rejects invalid signature', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const wrongMsg = composeMessage('wrong', []);
    const wrongSig = toHex(
      nacl.sign.detached(stringToBytes(wrongMsg), keypair.secretKey)
    );
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes: [],
        signature: wrongSig,
      },
    });
    expect(res.statusCode).toBe(401);
  });

  test('rejects replayed challenges', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge, ttl } = start.json();
    expect(ttl).toBe(120);
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const payload = {
      publicKey: toHex(keypair.publicKey),
      challenge,
      scopes: [],
      signature: sig,
    };
    const first = await app.inject({ method: 'POST', url: '/auth/ton/verify', payload });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({ method: 'POST', url: '/auth/ton/verify', payload });
    expect(second.statusCode).toBe(400);
  });

  test('rejects invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: { publicKey: 'bad' },
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects non-hex public key', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: 'zz',
        challenge,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects short public key', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const shortPk = toHex(keypair.publicKey).slice(0, 60);
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: shortPk,
        challenge,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects long public key', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const longPk = toHex(keypair.publicKey) + 'aa';
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: longPk,
        challenge,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects short signature', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig = toHex(
      nacl.sign.detached(stringToBytes(msg), keypair.secretKey)
    ).slice(0, 120);
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects long signature', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig =
      toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey)) + 'aa';
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects expired challenge', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge, ttl } = start.json();
    expect(ttl).toBe(120);
    const originalNow = Date.now;
    const now = originalNow();
    // simulate expiration
    // @ts-expect-error: override Date.now for test
    Date.now = () => now + (ttl + 1) * 1000;
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
    Date.now = originalNow;
  });

  test('rejects scope escalation', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const signedScopes = ['read'];
    const msg = composeMessage(challenge, signedScopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        scopes: ['read', 'write'],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(401);
  });

  test('rotates short-lived tokens', async () => {
    const start1 = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge: ch1 } = start1.json();
    const msg1 = composeMessage(ch1, []);
    const sig1 = toHex(nacl.sign.detached(stringToBytes(msg1), keypair.secretKey));
    const first = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge: ch1,
        scopes: [],
        signature: sig1,
      },
    });
    const t1 = getCookie(first as LightMyRequestResponse, 'sid');
    const { payload: p1 } = await jwtVerify(t1!.value, secretBytes);

    // ensure a different expiration timestamp for the rotated token
    await new Promise((r) => setTimeout(r, 1000));

    const start2 = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge: ch2 } = start2.json();
    const msg2 = composeMessage(ch2, []);
    const sig2 = toHex(nacl.sign.detached(stringToBytes(msg2), keypair.secretKey));
    const second = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge: ch2,
        scopes: [],
        signature: sig2,
      },
    });
    const t2 = getCookie(second as LightMyRequestResponse, 'sid');
    const { payload: p2 } = await jwtVerify(t2!.value, secretBytes);
    // second token should have a later expiry, proving rotation
    expect(p2.exp).toBeGreaterThan(p1.exp);
    expect(p2.exp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 60 * 60);
  });

  test('includes session key expiration in token', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const session = toHex(nacl.sign.keyPair().publicKey);
    const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
    const msg = composeMessage(challenge, [], session, exp);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        sessionPubKey: session,
        exp,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(200);
    const tokenCookie = getCookie(res as LightMyRequestResponse, 'sid');
    const { payload } = await jwtVerify(tokenCookie!.value, secretBytes);
    expect(payload.session).toBe(session);
    expect(payload.sessionExp).toBe(Math.floor(exp / 1000));
    expect(payload.exp).toBeLessThanOrEqual(payload.sessionExp);
  });

  test('rejects session key exp over one hour', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const session = toHex(nacl.sign.keyPair().publicKey);
    const exp = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    const msg = composeMessage(challenge, [], session, exp);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        publicKey: toHex(keypair.publicKey),
        challenge,
        sessionPubKey: session,
        exp,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});
