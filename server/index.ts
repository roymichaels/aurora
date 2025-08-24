// [AURORA-BEGIN:server-entry]
import Fastify from 'fastify';
import cookie from '@fastify/cookie';

import authTon from './auth/ton';
import replicate from './replicate';
import nftAssets from './nft/assets';
import nftMetadata from './nft/metadata';

const server = Fastify({ logger: true });

async function build() {
  await server.register(cookie);
  await server.register(authTon);
  await server.register(replicate);
  await server.register(nftAssets);
  await server.register(nftMetadata);
}

build();

const port = Number(process.env.PORT) || 3000;
server.listen({ port, host: '0.0.0.0' }).catch((err) => {
  server.log.error(err);
  process.exit(1);
});
// [AURORA-END:server-entry]
