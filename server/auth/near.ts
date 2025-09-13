import type { FastifyPluginAsync } from 'fastify';

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/auth/near/ping', async () => ({ ok: true }));
};

export default plugin;
