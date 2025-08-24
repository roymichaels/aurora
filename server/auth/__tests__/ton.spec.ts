import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import { jwtVerify } from 'jose';
import tonAuth, { composeMessage } from '../ton';
let nacl: any;
let bytesToHex: any;
let stringToBytes: any;


function toHex(buf: Uint8Array): string {
  return bytesToHex(buf);
}

describe('TON auth', () => {
  let app: FastifyInstance;
  let keypair: any;
  const secretBytes = new TextEncoder().encode('secret');

  beforeAll(async () => {
    const TonWeb = await import('tonweb');
    const utils = (TonWeb as any).utils || (TonWeb as any).default.utils;
    ({ nacl, bytesToHex, stringToBytes } = utils);
  });

  beforeEach(async () => {
    app = fastify();
    await app.register(cookie);
    await app.register(tonAuth);
    await app.ready();
    keypair = nacl.sign.keyPair();
  });

  afterEach(async () => {
    await app.close();
  });

  test('accepts valid signature and sets cookie', async () => {
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
    const tokenCookie = res.cookies.find((c: any) => c.name === 'sid');
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
});
