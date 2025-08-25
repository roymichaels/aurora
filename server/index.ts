// [AURORA-BEGIN:server-entry]
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
// [AURORA-BEGIN:ton-manifest-dev]
import path from 'node:path';
import fs from 'node:fs';
// [AURORA-END:ton-manifest-dev]

import authTon from './auth/ton';
import replicate from './replicate';
import nftAssets from './nft/assets';

const server = Fastify({ logger: true });

async function build() {
  await server.register(cookie);
  await server.register(authTon);
  await server.register(replicate);
  await server.register(nftAssets);
}

build();

// [AURORA-BEGIN:ton-manifest-dev]
server.get('/tonconnect-manifest.json', async (req, reply) => {
  const p = path.join(process.cwd(), 'public', 'tonconnect-manifest.json'); // read from public directory
  if (!fs.existsSync(p)) return reply.code(404).send({ error: 'manifest not found' });
  const json = fs.readFileSync(p, 'utf8');
  reply
    .header('Content-Type', 'application/json; charset=utf-8')
    .header('Access-Control-Allow-Origin', '*')
    .send(json);
});
// [AURORA-END:ton-manifest-dev]

const port = Number(process.env.PORT) || 3000;
server.listen({ port, host: '0.0.0.0' }).catch((err) => {
  server.log.error(err);
  process.exit(1);
});
// [AURORA-END:server-entry]
