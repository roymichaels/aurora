// [AURORA-BEGIN:asset-routes]
import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { jwtVerify } from 'jose';

import { pinFile, pinJSON, ipfsUri } from '../utils/pinata';
import { setCidForKey, listAllAssets, AssetKey } from '../utils/cid-registry';

const plugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(multipart, { limits: { fileSize: 1.5 * 1024 * 1024 } });

  // [AURORA-BEGIN:asset-security]
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);
  const rateLimiter = new RateLimiterMemory({ points: 10, duration: 60 });

  async function requireAdmin(req: any, reply: any) {
    const token = req.cookies?.sid;
    if (!token) {
      reply.code(401).send({ error: 'missing_token' });
      return null;
    }
    try {
      const { payload }: any = await jwtVerify(token, JWT_SECRET_BYTES);
      if (!Array.isArray(payload.scopes) || !payload.scopes.includes('nft:admin')) {
        reply.code(403).send({ error: 'insufficient_scope' });
        return null;
      }
      try {
        await rateLimiter.consume(payload.sub);
      } catch {
        reply.code(429).send({ error: 'rate_limited' });
        return null;
      }
      return payload;
    } catch {
      reply.code(401).send({ error: 'invalid_token' });
      return null;
    }
  }
  // [AURORA-END:asset-security]

  function isValidKey(key: string): key is AssetKey {
    return key === 'auroraid/base' || key === 'seasonpass/base' || key.startsWith('badge/');
  }

  fastify.get('/nft/assets', async (req, reply) => {
    const auth = await requireAdmin(req, reply);
    if (!auth) return;
    const list = await listAllAssets();
    return reply.send(list.map((a) => ({ ...a, uri: ipfsUri(a.cid) })));
  });

  fastify.post('/nft/assets/pin-file', async (req, reply) => {
    const auth = await requireAdmin(req, reply);
    if (!auth) return;

    const parts = req.parts();
    let file: any = null;
    let key: string | undefined;
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'file') file = part;
      if (part.type === 'field' && part.fieldname === 'key') key = part.value;
    }
    if (!file || !key || !isValidKey(key)) {
      return reply.code(400).send({ error: 'invalid_payload' });
    }
    if (!['image/png', 'image/svg+xml'].includes(file.mimetype)) {
      return reply.code(400).send({ error: 'invalid_mime' });
    }
    const buf = await file.toBuffer();
    if (buf.byteLength > 1.5 * 1024 * 1024) {
      return reply.code(400).send({ error: 'file_too_large' });
    }
    const cid = await pinFile(key, buf, file.mimetype);
    await setCidForKey(key as AssetKey, cid);
    return reply.send({ key, cid, uri: ipfsUri(cid) });
  });

  fastify.post('/nft/assets/pin-svg', async (req, reply) => {
    const auth = await requireAdmin(req, reply);
    if (!auth) return;
    const body = z.object({ key: z.string(), svg: z.string() }).safeParse(req.body);
    if (!body.success || !isValidKey(body.data.key)) {
      return reply.code(400).send({ error: 'invalid_payload' });
    }
    const { key, svg } = body.data;
    if (svg.toLowerCase().includes('<script') || Buffer.byteLength(svg, 'utf8') > 200 * 1024) {
      return reply.code(400).send({ error: 'invalid_svg' });
    }
    const cid = await pinJSON(key, { svg });
    await setCidForKey(key as AssetKey, cid);
    return reply.send({ key, cid, uri: ipfsUri(cid) });
  });
};

export default plugin;
// [AURORA-END:asset-routes]
