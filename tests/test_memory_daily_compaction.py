import time
from memory import store as mem


def setup_function(_):
    mem.cur.execute("DELETE FROM memories")
    mem.cur.execute("DELETE FROM summaries")
    mem.cur.execute("DELETE FROM meta WHERE key=?", (mem.LAST_COMPACT_KEY,))
    mem.conn.commit()
    mem.vector_store.clear()


def teardown_function(_):
    mem.cur.execute("DELETE FROM memories")
    mem.cur.execute("DELETE FROM summaries")
    mem.cur.execute("DELETE FROM meta WHERE key=?", (mem.LAST_COMPACT_KEY,))
    mem.conn.commit()
    mem.vector_store.clear()


def test_daily_compaction():
    low = mem.save_memory("low importance", {"importance": 0.1})
    high = mem.save_memory("high importance", {"importance": 5})
    yesterday = time.time() - 86400
    mem.cur.execute("UPDATE memories SET created_at=? WHERE id=?", (yesterday, low))
    mem.cur.execute("UPDATE memories SET created_at=? WHERE id=?", (yesterday, high))
    mem.conn.commit()
    mem.cur.execute(
        "INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?)",
        (mem.LAST_COMPACT_KEY, "1970-01-01"),
    )
    mem.conn.commit()
    mem._maybe_compact_daily()
    mem.cur.execute("SELECT compacted FROM memories WHERE id=?", (low,))
    assert mem.cur.fetchone()[0] == 1
    mem.cur.execute("SELECT compacted FROM memories WHERE id=?", (high,))
    assert mem.cur.fetchone()[0] == 0
    mem.cur.execute("SELECT text FROM summaries WHERE scope='daily'")
    rows = mem.cur.fetchall()
    assert len(rows) == 1
    assert "low importance" in rows[0][0]
    assert str(low) not in mem.vector_store._ids
    assert str(high) in mem.vector_store._ids
