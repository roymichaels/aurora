// [AURORA-BEGIN:server-entry]
import Fastify from 'fastify';
import cookie from '@fastify/cookie';

import authNear from './auth/near';
import replicate from './replicate';

const server = Fastify({ logger: true });

async function build() {
  await server.register(cookie);
  await server.register(authNear);
  await server.register(replicate);
  if (process.env.ENABLE_NFT_ASSETS !== 'false') {
    const nftAssets = (await import('./nft/assets')).default;
    await server.register(nftAssets);
  }
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
