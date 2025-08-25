// [AURORA-BEGIN:server-entry]
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authTon from './auth/ton';
import replicate from './replicate';

const server = Fastify({ logger: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '../public/tonconnect-manifest.json');

async function build() {
  await server.register(cookie);
  await server.register(authTon);
  await server.register(replicate);
  if (process.env.ENABLE_NFT_ASSETS !== 'false') {
    const nftAssets = (await import('./nft/assets')).default;
    await server.register(nftAssets);
  }
  server.get('/tonconnect-manifest.json', async (req, reply) => {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const origin = process.env.VITE_ORIGIN || `${req.protocol}://${req.headers.host}`;
    reply.header('Content-Type', 'application/json').send(raw.replace('%VITE_ORIGIN%', origin));
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
