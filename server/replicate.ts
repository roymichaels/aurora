import type {
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const paramsSchema = z.object({
  collection: z.string().regex(/^[a-zA-Z0-9_-]+$/),
});

const plugin: FastifyPluginAsync = async (fastify) => {
  const rateLimiter = new RateLimiterMemory({ points: 100, duration: 60 });
  const jwtSecret = process.env.JWT_SECRET || 'secret';
  const jwtSecretBytes = new TextEncoder().encode(jwtSecret);

  await fastify.register(cors, { origin: false });
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
      },
    },
  });

  fastify.addHook('onRequest', async (req, reply) => {
    try {
      await rateLimiter.consume(req.ip);
    } catch {
      return reply.code(429).send({ error: 'too_many_requests' });
    }
  });

  interface TokenPayload {
    scopes?: string[];
    sub?: string;
  }

  async function authorize(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<TokenPayload | null> {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'missing_token' });
      return null;
    }
    try {
      const { payload } = await jwtVerify<TokenPayload>(
        auth.slice(7),
        jwtSecretBytes,
      );
      if (!Array.isArray(payload.scopes) || !payload.scopes.includes('replicate')) {
        reply.code(401).send({ error: 'invalid_scope' });
        return null;
      }
      if (!payload.sub) {
        reply.code(401).send({ error: 'invalid_token' });
        return null;
      }
      return payload;
    } catch {
      reply.code(401).send({ error: 'invalid_token' });
      return null;
    }
  }

  async function proxy(
    req: FastifyRequest<{ Params: { collection: string }; Body: unknown }>,
    reply: FastifyReply,
    action: string,
  ) {
    const params = paramsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'invalid_params' });
    }
    const payload = await authorize(req, reply);
    if (!payload) return;
    const dbName = encodeURIComponent(`${payload.sub}-${params.data.collection}`);
    const queryIndex = req.url.indexOf('?');
    const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
    const couchUrl = process.env.COUCH_URL || 'http://localhost:5984';
    const url = `${couchUrl}/${dbName}/${action}${query}`;
    const res = await fetch(url, {
      method: req.method,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });
    reply.code(res.status);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      reply.send(await res.json());
    } else {
      reply.send(await res.text());
    }
  }

  fastify.all<{ Params: { collection: string }; Body: unknown }>(
    '/replicate/:collection/_changes',
    async (req, reply) => {
      await proxy(req, reply, '_changes');
    },
  );

  fastify.post<{ Params: { collection: string }; Body: unknown }>(
    '/replicate/:collection/_bulk_docs',
    async (req, reply) => {
      await proxy(req, reply, '_bulk_docs');
    },
  );
};

export default plugin;
