import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import { jwtVerify } from 'jose';
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
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        address: toHex(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
      protocol: 'http',
    });
    expect(res.statusCode).toBe(200);
    const cookie = res.cookies.find((c: { name: string }) => c.name === 'sid');
    expect(cookie).toBeDefined();
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('Lax');
    expect(cookie.secure).toBeUndefined();
  });

  test('sets secure cookie over HTTPS', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        address: toHex(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
      protocol: 'https',
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(res.statusCode).toBe(200);
    const cookie = res.cookies.find((c: { name: string }) => c.name === 'sid');
    expect(cookie).toBeDefined();
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('Lax');
    expect(cookie.secure).toBe(true);
  });

  test('clears cookie on logout', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge } = start.json();
    const msg = composeMessage(challenge, []);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const login = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        address: toHex(keypair.publicKey),
        challenge,
        scopes: [],
        signature: sig,
      },
      protocol: 'https',
      headers: { 'x-forwarded-proto': 'https' },
    });
    const token = login.cookies.find((c: { name: string }) => c.name === 'sid');
    expect(token).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { sid: token.value },
      protocol: 'https',
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    const cleared = res.cookies.find((c: { name: string }) => c.name === 'sid');
    expect(cleared).toBeDefined();
    expect(cleared.value).toBe('');
    expect(cleared.expires.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(cleared.secure).toBe(true);
  });

  test('rejects replayed challenges', async () => {

    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge, ttl } = start.json();
    expect(ttl).toBe(120);
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const res = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        address: toHex(keypair.publicKey),
        challenge,
        scopes,
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(200);
    const tokenCookie = res.cookies.find((c: { name: string }) => c.name === 'sid');
    expect(tokenCookie).toBeDefined();
    const { payload: tokenPayload } = await jwtVerify(tokenCookie.value, secretBytes);
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
        address: toHex(keypair.publicKey),
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
      address: toHex(keypair.publicKey),
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
      payload: { address: 'bad' },
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
        address: toHex(keypair.publicKey),
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
        address: toHex(keypair.publicKey),
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
        address: toHex(keypair.publicKey),
        challenge: ch1,
        scopes: [],
        signature: sig1,
      },
    });
    const t1 = first.cookies.find((c: { name: string }) => c.name === 'sid');
    const { payload: p1 } = await jwtVerify(t1.value, secretBytes);

    const start2 = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge: ch2 } = start2.json();
    const msg2 = composeMessage(ch2, []);
    const sig2 = toHex(nacl.sign.detached(stringToBytes(msg2), keypair.secretKey));
    const second = await app.inject({
      method: 'POST',
      url: '/auth/ton/verify',
      payload: {
        address: toHex(keypair.publicKey),
        challenge: ch2,
        scopes: [],
        signature: sig2,
      },
    });
    const t2 = second.cookies.find((c: { name: string }) => c.name === 'sid');
    const { payload: p2 } = await jwtVerify(t2.value, secretBytes);
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
        address: toHex(keypair.publicKey),
        challenge,
        sessionPubKey: session,
        exp,
        scopes: [],
        signature: sig,
      },
    });
    expect(res.statusCode).toBe(200);
    const tokenCookie = res.cookies.find((c: { name: string }) => c.name === 'sid');
    const { payload } = await jwtVerify(tokenCookie.value, secretBytes);
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
        address: toHex(keypair.publicKey),
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
