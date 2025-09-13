import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import * as nacl from 'tweetnacl';
import { z } from 'zod';
import * as crypto from 'crypto';

const CHALLENGE_TTL = 120; // seconds
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

export function composeMessage(
  challenge: string,
  scopes: string[] = [],
  sessionPubKey?: string,
  exp?: number,
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

  fastify.post('/auth/near/start', async (_req, reply) => {
    const challenge = nanoid();
    const ttl = CHALLENGE_TTL;
    challenges.set(challenge, Date.now() + ttl * 1000);
    return reply.send({ challenge, ttl });
  });

  fastify.post('/auth/near/verify', async (req, reply) => {
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
      pkBytes = Buffer.from(publicKey, 'hex');
      if (pkBytes.length !== 32) throw new Error('invalid');
    } catch {
      try {
        pkBytes = Buffer.from(publicKey, 'base64');
      } catch {
        return reply.code(400).send({ error: 'invalid_public_key' });
      }
      if (pkBytes.length !== 32) {
        return reply.code(400).send({ error: 'invalid_public_key' });
      }
    }

    const message = composeMessage(challenge, scopes, sessionPubKey, exp);

    let sigBytes: Uint8Array;
    try {
      sigBytes = Buffer.from(signature, 'hex');
      if (sigBytes.length !== 64) throw new Error('invalid');
    } catch {
      try {
        sigBytes = Buffer.from(signature, 'base64');
      } catch {
        return reply.code(400).send({ error: 'invalid_signature' });
      }
      if (sigBytes.length !== 64) {
        return reply.code(400).send({ error: 'invalid_signature' });
      }
    }

    let ok: boolean;
    try {
      ok = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        sigBytes,
        pkBytes,
      );
    } catch {
      return reply.code(401).send({ error: 'invalid_signature' });
    }
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
      if (!exp || exp > Date.now() + 60 * 60 * 1000) {
        return reply.code(400).send({ error: 'invalid_grant_exp' });
      }
      payload.session = sessionPubKey;
      payload.sessionExp = Math.floor(exp / 1000);
      tokenExp = Math.min(tokenExp, payload.sessionExp);
    }

    const token = (() => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const body = Buffer.from(
        JSON.stringify({ ...payload, exp: tokenExp }),
      ).toString('base64url');
      const data = `${header}.${body}`;
      const sig = crypto
        .createHmac('sha256', JWT_SECRET_BYTES)
        .update(data)
        .digest('base64url');
      return `${data}.${sig}`;
    })();
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
