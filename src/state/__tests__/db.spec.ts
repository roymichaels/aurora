import 'fake-indexeddb/auto';
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie, getDexieDbWithTables } from 'rxdb/plugins/storage-dexie';
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { firstValueFrom } from 'rxjs';
import { map, take, toArray } from 'rxjs';
import { keyManager } from '../keyManager';

describe('RxDB journal collection', () => {
  let db: any;

  beforeAll(async () => {
    addRxPlugin(RxDBUpdatePlugin);
    const storage = wrappedKeyEncryptionCryptoJsStorage({ storage: getRxStorageDexie() });
    db = await createRxDatabase({
      name: 'testdb',
      storage,
      password: keyManager.getKey(),
    });
    await db.addCollections({
      journal: {
        schema: {
          title: 'journal',
          version: 0,
          primaryKey: 'id',
          type: 'object',
          properties: {
            id: { type: 'string', maxLength: 100 },
            text: { type: 'string' },
          },
          required: ['id', 'text'],
          encrypted: ['text'],
        },
      },
    });
  });

  afterAll(async () => {
    await db.close();
  });

  test('CRUD operations work', async () => {
    const col = db.journal;
    const inserted = await col.insert({ id: '1', text: 'hello' });
    expect(inserted.text).toBe('hello');

    let doc = await col.findOne('1').exec();
    expect(doc?.text).toBe('hello');

    await doc?.update({ $set: { text: 'updated' } });
    doc = await col.findOne('1').exec();
    expect(doc?.text).toBe('updated');

    await doc?.remove();
    const docs = await col.find().exec();
    expect(docs.length).toBe(0);
  });

  test('documents are stored encrypted in Dexie', async () => {
    const col = db.journal;
    await col.insert({ id: '2', text: 'secret text' });

    const state = await getDexieDbWithTables('testdb', 'journal', {}, col.schema.jsonSchema);
    const raw = await state.dexieTable.get('2');
    expect(raw.text).not.toBe('secret text');
    await col.findOne('2').remove();
  });

  test('live query emits updates', async () => {
    const col = db.journal;
    const emissionsPromise = firstValueFrom(
      col
        .find()
        .$.
        pipe(
          map((docs: any[]) => docs.map((d) => d.text)),
          take(4),
          toArray(),
        ),
    );

    await col.insert({ id: '3', text: 'first' });
    await col.findOne('3').update({ $set: { text: 'second' } });
    await col.findOne('3').remove();

    const emissions = await emissionsPromise;
    expect(emissions).toEqual([[], ['first'], ['second'], []]);
  });
});
