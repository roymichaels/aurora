// [AURORA-BEGIN:server-entry]
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import fs from 'node:fs/promises';
import path from 'node:path';

import authTon from './auth/ton';
import replicate from './replicate';

const server = Fastify({ logger: true });
const manifestPath = path.resolve(process.cwd(), 'public/tonconnect-manifest.json');

async function build() {
  await server.register(cookie);
  await server.register(authTon);
  await server.register(replicate);
  if (process.env.ENABLE_NFT_ASSETS !== 'false') {
    const nftAssets = (await import('./nft/assets')).default;
    await server.register(nftAssets);
  }
  server.options('/tonconnect-manifest.json', async (_req, reply) => {
    reply
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET,OPTIONS')
      .header('Access-Control-Allow-Headers', '*')
      .code(204)
      .send();
  });

  server.get('/tonconnect-manifest.json', async (req, reply) => {
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8');
      const origin =
        process.env.VITE_PUBLIC_ORIGIN ||
        `${req.protocol}://${req.headers.host}`;
      reply
        .header('Content-Type', 'application/json')
        .header('Cache-Control', 'no-store')
        .header('Access-Control-Allow-Origin', '*')
        .header('Access-Control-Allow-Methods', 'GET,OPTIONS')
        .header('Access-Control-Allow-Headers', '*')
        .send(raw.replace('%VITE_ORIGIN%', origin));
    } catch (err) {
      server.log.error(err);
      reply.code(404).send({ error: 'tonconnect-manifest.json not found' });
    }
  });
}

const start = async () => {
  try {
    await build();
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
// [AURORA-END:server-entry]
