// [AURORA-BEGIN:cid-registry]

const couchUrl = process.env.COUCH_URL || 'http://localhost:5984';
const dbName = process.env.COUCH_DB_ASSETS || 'assets';
const dbUrl = `${couchUrl}/${dbName}`;

async function ensureDb() {
  try {
    const res = await fetch(dbUrl, { method: 'HEAD' });
    if (res.status === 404) {
      await fetch(dbUrl, { method: 'PUT' });
    }
  } catch (err) {
    console.error('Failed to ensure CouchDB exists', err);
    throw err;
  }
}

void ensureDb().catch(console.error);

export type AssetKey = 'auroraid/base' | 'seasonpass/base' | `badge/${string}`;

interface AssetDocument {
  _id: string;
  cid: string;
  updatedAt: string;
  _rev?: string;
}

export async function getCidForKey(key: AssetKey): Promise<string | undefined> {
  const res = await fetch(`${dbUrl}/${encodeURIComponent(key)}`);
  if (res.status === 200) {
    const json: AssetDocument = await res.json();
    return json.cid;
  }
  return undefined;
}

export async function setCidForKey(key: AssetKey, cid: string) {
  const now = new Date().toISOString();
  const docUrl = `${dbUrl}/${encodeURIComponent(key)}`;
  const existing = await fetch(docUrl);
  let rev: string | undefined;
  if (existing.status === 200) {
    const doc: AssetDocument = await existing.json();
    rev = doc._rev;
  }
  await fetch(docUrl, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _id: key, cid, updatedAt: now, ...(rev ? { _rev: rev } : {}) }),
  });
}

interface AllDocsRow<T> {
  id: string;
  key: string;
  value: { rev: string };
  doc?: T;
}

interface AllDocsResponse<T> {
  rows: Array<AllDocsRow<T>>;
}

export async function listAllAssets(): Promise<Array<{ key: string; cid: string; updatedAt: string }>> {
  const res = await fetch(`${dbUrl}/_all_docs?include_docs=true`);
  if (!res.ok) return [];
  const json: AllDocsResponse<AssetDocument> = await res.json();
  return json.rows
    .filter((r): r is AllDocsRow<AssetDocument> & { doc: AssetDocument } => Boolean(r.doc))
    .map((r) => ({ key: r.doc._id, cid: r.doc.cid, updatedAt: r.doc.updatedAt }));
}
// [AURORA-END:cid-registry]
