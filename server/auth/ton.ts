import type { FastifyPluginAsync } from 'fastify';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// tonweb is a CommonJS module so we load it via dynamic import
const TonWeb = (await import('tonweb')).default;

const CHALLENGE_TTL = 120; // seconds
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

const { stringToBytes, hexToBytes, nacl } = TonWeb.utils;

export function composeMessage(
  challenge: string,
  scopes: string[] = [],
  sessionPubKey?: string,
  exp?: number
): string {
  return [challenge, sessionPubKey || '', exp ? String(exp) : '', scopes.join(',')].join('|');
}

const verifySchema = z.object({
  publicKey: z.string(),
  signature: z.string(),
  challenge: z.string(),
  sessionPubKey: z.string().optional(),
  exp: z.number().optional(),
  scopes: z.array(z.string()).default([]),
});

const plugin: FastifyPluginAsync = async (fastify) => {
  const challenges = new Map<string, number>();

  fastify.post('/auth/ton/start', async (_req, reply) => {
    const challenge = nanoid();
    const ttl = CHALLENGE_TTL;
    challenges.set(challenge, Date.now() + ttl * 1000);
    return reply.send({ challenge, ttl });
  });

  fastify.post('/auth/ton/verify', async (req, reply) => {
    const body = verifySchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'invalid_payload' });
    }
    const { publicKey, signature, challenge, sessionPubKey, scopes, exp } = body.data;

    const expiresAt = challenges.get(challenge);
    if (!expiresAt) {
      return reply.code(400).send({ error: 'invalid_challenge' });
    }
    if (Date.now() > expiresAt) {
      challenges.delete(challenge);
      return reply.code(400).send({ error: 'challenge_expired' });
    }
    challenges.delete(challenge);

    let pkBytes: Uint8Array;
    try {
      pkBytes = hexToBytes(publicKey);
    } catch {
      return reply.code(400).send({ error: 'invalid_public_key' });
    }

    const message = composeMessage(challenge, scopes, sessionPubKey, exp);
    const ok = nacl.sign.detached.verify(
      stringToBytes(message),
      hexToBytes(signature),
      pkBytes
    );
    if (!ok) {
      return reply.code(401).send({ error: 'invalid_signature' });
    }

    const now = Math.floor(Date.now() / 1000);
    let tokenExp = now + 60 * 60; // rotate tokens every hour
    const payload: {
      sub: string;
      scopes: string[];
      session?: string;
      sessionExp?: number;
    } = {
      sub: publicKey,
      scopes,
    };

    if (sessionPubKey) {
      // session key must expire within one hour
      if (!exp || exp > Date.now() + 60 * 60 * 1000) {
        return reply.code(400).send({ error: 'invalid_grant_exp' });
      }
      payload.session = sessionPubKey;
      payload.sessionExp = Math.floor(exp / 1000);
      // token cannot outlive the session key
      tokenExp = Math.min(tokenExp, payload.sessionExp);
    }

    // a fresh JWT is issued for every verification to force rotation
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(tokenExp)
      .sign(JWT_SECRET_BYTES);
    reply.setCookie('sid', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.protocol === 'https',
      path: '/',
    });
    return reply.send({ ok: true });
  });

  fastify.post('/auth/logout', async (req, reply) => {
    reply.clearCookie('sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.protocol === 'https',
      path: '/',
    });
    return reply.send({ ok: true });
  });
};

export default plugin;
