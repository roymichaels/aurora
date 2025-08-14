import { useEffect, useMemo, useRef, useState } from 'react';
import { openBrainDb } from '@/memory/brainDb';
import { exportEncryptedBrain, importEncryptedBrain } from '@/memory/brainBackup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Memory {
  id: number;
  content: string;
  tags: string;
  type: string;
  importance: number;
  pinned: number;
  why?: string;
}

export default function BrainView() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Memory | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editType, setEditType] = useState('semantic');
  const [editImportance, setEditImportance] = useState('0');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const db = await openBrainDb();
    db.run(
      'CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, tags TEXT, type TEXT, importance INTEGER DEFAULT 0, pinned INTEGER DEFAULT 0)'
    );
    const stmt = db.prepare(
      'SELECT id, content, tags, type, importance, pinned FROM memories ORDER BY pinned DESC, id DESC'
    );
    const list: Memory[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      list.push({
        id: Number(row.id),
        content: String(row.content || ''),
        tags: String(row.tags || ''),
        type: String(row.type || 'semantic'),
        importance: Number(row.importance || 0),
        pinned: Number(row.pinned || 0),
      });
    }
    stmt.free();
    setMemories(list);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return memories
      .filter((m) =>
        m.content.toLowerCase().includes(q)
      )
      .filter((m) =>
        typeFilter === 'all' ? true : m.type === typeFilter
      )
      .filter((m) =>
        tagFilter === 'all'
          ? true
          : m.tags.split(',').map((t) => t.trim()).includes(tagFilter)
      )
      .map((m) => ({
        ...m,
        why: q ? `Matches "${query}"` : undefined,
      }));
  }, [memories, query, typeFilter, tagFilter]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('Brain retrieval', filtered.slice(0, 5));
    }
  }, [filtered]);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(memories.map((m) => m.type))),
    [memories]
  );
  const uniqueTags = useMemo(
    () =>
      Array.from(
        new Set(
          memories.flatMap((m) =>
            m.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          )
        )
      ),
    [memories]
  );

  const startEdit = (m: Memory) => {
    setEditing(m);
    setEditContent(m.content);
    setEditTags(m.tags);
    setEditType(m.type);
    setEditImportance(String(m.importance));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const db = await openBrainDb();
    db.run(
      `UPDATE memories SET content='${editContent.replace(/'/g, "''")}', tags='${editTags.replace(/'/g, "''")}', type='${editType}', importance=${Number(editImportance)} WHERE id=${editing.id}`
    );
    await db.saveToDisk();
    setEditing(null);
    load();
  };

  const togglePin = async (m: Memory) => {
    const db = await openBrainDb();
    db.run(`UPDATE memories SET pinned=${m.pinned ? 0 : 1} WHERE id=${m.id}`);
    await db.saveToDisk();
    load();
  };

  const remove = async (id: number) => {
    const db = await openBrainDb();
    db.run(`DELETE FROM memories WHERE id=${id}`);
    await db.saveToDisk();
    load();
  };

  const handleExport = async () => {
    const pass = prompt('Passphrase to encrypt backup') || '';
    if (!pass) return;
    const blob = await exportEncryptedBrain(pass);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brain-backup.bin';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const pass = prompt('Passphrase to decrypt backup') || '';
    if (!pass) return;
    await importEncryptedBrain(file, pass);
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Brain</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search memories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {uniqueTags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {uniqueTypes.map((type) => {
        const items = filtered.filter((m) => m.type === type);
        if (items.length === 0) return null;
        return (
          <div key={type} className="space-y-2">
            <h2 className="text-lg font-semibold">{type}</h2>
            <div className="space-y-3">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="p-3 border rounded-lg relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p>{m.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {m.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                        <Badge variant="outline">Imp {m.importance}</Badge>
                        {m.why && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            Why I recalled this: {m.why}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => togglePin(m)}>
                        {m.pinned ? 'Unpin' : 'Pin'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(m)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="space-y-2 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Memories are stored privately on this device. You can download or restore an encrypted backup.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>Download Brain</Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Restore Brain
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <Input
              placeholder="tags (comma separated)"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
            />
            <Select value={editType} onValueChange={setEditType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['semantic', 'episodic', 'procedural'].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="importance"
              value={editImportance}
              onChange={(e) => setEditImportance(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
