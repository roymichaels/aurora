import fastify from 'fastify';
import replicatePlugin from '../../replicate';
import cookie from '@fastify/cookie';
import { signJWT } from '../../jwt';

const secret = 'secret';
const secretBytes = new TextEncoder().encode(secret);

async function sign(scopes: string[]) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  return signJWT({ sub: 'user1', scopes }, secretBytes, exp);
}

describe('replicate plugin', () => {
  let app: any;
  let couch: any;
  let couchPort: number;
  let changesReq: any;
  let bulkReq: any;

  beforeAll(async () => {
    couch = fastify();
    couch.all('/:db/_changes', async (req) => {
      changesReq = { params: req.params, query: req.query };
      return { results: [] };
    });
    couch.post('/:db/_bulk_docs', async (req) => {
      bulkReq = { params: req.params, body: req.body };
      return { ok: true };
    });
    await couch.listen({ port: 0, host: '127.0.0.1' });
    couchPort = (couch.server.address() as any).port;
    process.env.COUCH_URL = `http://127.0.0.1:${couchPort}`;
    process.env.JWT_SECRET = secret;
  });

  afterAll(async () => {
    await couch.close();
  });

  beforeEach(async () => {
    changesReq = undefined;
    bulkReq = undefined;
    app = fastify();
    await app.register(cookie);
    await app.register(replicatePlugin);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('proxies changes feed', async () => {
    const token = await sign(['replicate']);
    const res = await app.inject({
      method: 'GET',
      url: '/replicate/tasks/_changes?since=0',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ results: [] });
    expect(changesReq.params.db).toBe('user1-tasks');
    expect(changesReq.query.since).toBe('0');
  });

  test('proxies bulk docs', async () => {
    const token = await sign(['replicate']);
    const payload = { docs: [{ _id: 'a' }] };
    const res = await app.inject({
      method: 'POST',
      url: '/replicate/tasks/_bulk_docs',
      headers: { authorization: `Bearer ${token}` },
      payload,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(bulkReq.params.db).toBe('user1-tasks');
    expect(bulkReq.body).toEqual(payload);
  });

  test('rejects missing scope', async () => {
    const token = await sign([]);
    const res = await app.inject({
      method: 'GET',
      url: '/replicate/tasks/_changes',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });
});
