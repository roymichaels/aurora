import { exportEncryptedBrain, importEncryptedBrain } from './brainBackup';
import { openBrainDb, closeBrainDb, __setMemoryDb } from './brainDb';

describe('brain backup round trip', () => {
  it('exports and restores memories', async () => {
    __setMemoryDb(null);
    const db = await openBrainDb();
    db.run("CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT)");
    db.run("INSERT INTO memories (content) VALUES ('hello')");
    await db.saveToDisk();
    const blob = await exportEncryptedBrain('pass');
    await closeBrainDb();
    __setMemoryDb(null);
    await importEncryptedBrain(blob, 'pass');
    const db2 = await openBrainDb();
    const stmt = db2.prepare("SELECT content FROM memories");
    let content = '';
    if (stmt.step()) {
      content = String(stmt.getAsObject().content || '');
    }
    stmt.free();
    expect(content).toBe('hello');
  });
});
