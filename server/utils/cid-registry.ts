// [AURORA-BEGIN:cid-registry]
import fetch from 'node-fetch';

const couchUrl = process.env.COUCH_URL || 'http://localhost:5984';
const dbName = process.env.COUCH_DB_ASSETS || 'assets';
const dbUrl = `${couchUrl}/${dbName}`;

async function ensureDb() {
  const res = await fetch(dbUrl, { method: 'HEAD' });
  if (res.status === 404) {
    await fetch(dbUrl, { method: 'PUT' });
  }
}
ensureDb();

export type AssetKey = 'auroraid/base' | 'seasonpass/base' | `badge/${string}`;

export async function getCidForKey(key: AssetKey): Promise<string | undefined> {
  const res = await fetch(`${dbUrl}/${encodeURIComponent(key)}`);
  if (res.status === 200) {
    const json: any = await res.json();
    return json.cid as string;
  }
  return undefined;
}

export async function setCidForKey(key: AssetKey, cid: string) {
  const now = new Date().toISOString();
  const docUrl = `${dbUrl}/${encodeURIComponent(key)}`;
  const existing = await fetch(docUrl);
  let rev: string | undefined;
  if (existing.status === 200) {
    const doc: any = await existing.json();
    rev = doc._rev;
  }
  await fetch(docUrl, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _id: key, cid, updatedAt: now, ...(rev ? { _rev: rev } : {}) }),
  });
}

export async function listAllAssets(): Promise<Array<{ key: string; cid: string; updatedAt: string }>> {
  const res = await fetch(`${dbUrl}/_all_docs?include_docs=true`);
  if (!res.ok) return [];
  const json: any = await res.json();
  return json.rows
    .filter((r: any) => r.doc)
    .map((r: any) => ({ key: r.doc._id, cid: r.doc.cid, updatedAt: r.doc.updatedAt }));
}
// [AURORA-END:cid-registry]
