import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';

import * as TonWeb from 'tonweb';
import { z } from 'zod';
import { signJWT } from '../jwt';


const CHALLENGE_TTL = 120; // seconds
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

export function composeMessage(
  challenge: string,
  scopes: string[] = [],
  sessionPubKey?: string,
  exp?: number
): string {
  return [challenge, sessionPubKey || '', exp ? String(exp) : '', scopes.join(',')].join('|');
}

const verifySchema = z.object({
  address: z.string(),
  signature: z.string(),
  challenge: z.string(),
  sessionPubKey: z.string().optional(),
  exp: z.number().optional(),
  scopes: z.array(z.string()).default([]),
});

const plugin: FastifyPluginAsync = async (fastify) => {
  const challenges = new Map<string, number>();

  fastify.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie('sid');
    return reply.send({ ok: true });
  });

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
    const { address, signature, challenge, sessionPubKey, scopes, exp } = body.data;

    const expiresAt = challenges.get(challenge);
    if (!expiresAt) {
      return reply.code(400).send({ error: 'invalid_challenge' });
    }
    if (Date.now() > expiresAt) {
      challenges.delete(challenge);
      return reply.code(400).send({ error: 'challenge_expired' });
    }
    challenges.delete(challenge);

    const { stringToBytes, hexToBytes, nacl } = TonWeb.utils;
    const message = composeMessage(challenge, scopes, sessionPubKey, exp);
    const ok = nacl.sign.detached.verify(
      stringToBytes(message),
      hexToBytes(signature),
      hexToBytes(address)
    );
    if (!ok) {
      return reply.code(401).send({ error: 'invalid_signature' });
    }

    const now = Math.floor(Date.now() / 1000);
    let tokenExp = now + 24 * 60 * 60; // default 24h
    const payload: { sub: string; scopes: string[]; session?: string } = {
      sub: address,
      scopes,
    };

    if (sessionPubKey) {
      if (!exp || exp > Date.now() + 60 * 60 * 1000) {
        return reply.code(400).send({ error: 'invalid_grant_exp' });
      }
      payload.session = sessionPubKey;
      tokenExp = Math.min(Math.floor(exp / 1000), now + 60 * 60);
    }

    const token = signJWT(payload, JWT_SECRET_BYTES, tokenExp);
    reply.setCookie('sid', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    return reply.send({ ok: true });
  });
};

export default plugin;
