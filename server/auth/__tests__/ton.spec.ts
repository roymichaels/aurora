import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import tonAuth, { composeMessage } from '../ton';
// TonWeb is CommonJS; require to access utils in Jest environment
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TonWeb = require('tonweb');
const { nacl, bytesToHex, stringToBytes } = TonWeb.utils;


function toHex(buf: Uint8Array): string {
  return bytesToHex(buf);
}

describe('TON auth', () => {
  let app: FastifyInstance;
  let keypair: nacl.SignKeyPair;
  const secretBytes = new TextEncoder().encode('secret');

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

  test('rejects replayed challenges', async () => {
    const start = await app.inject({ method: 'POST', url: '/auth/ton/start' });
    const { challenge, ttl } = start.json();
    expect(ttl).toBe(120);
    const scopes = ['read'];
    const msg = composeMessage(challenge, scopes);
    const sig = toHex(nacl.sign.detached(stringToBytes(msg), keypair.secretKey));
    const payload = {
      address: toHex(keypair.publicKey),
      challenge,
      scopes,
      signature: sig,
    };
    const first = await app.inject({ method: 'POST', url: '/auth/ton/verify', payload });
    expect(first.statusCode).toBe(200);

    const tokenCookie = first.cookies.find((c: any) => c.name === 'sid');
    expect(tokenCookie).toBeDefined();
    const { payload: tokenPayload } = await jwtVerify(tokenCookie.value, secretBytes);
    expect(tokenPayload.sub).toBe(toHex(keypair.publicKey));
    expect(tokenPayload.scopes).toEqual(scopes);
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
