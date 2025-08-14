import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { memoryStore, type MemoryBucket, type MemoryEntry } from "@/memory/indexedDbMemory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";

export default function MemoryPanel() {
  const focusChatInput = useChatInputFocus();
  const [bucket, setBucket] = useState<MemoryBucket>("semantic");
  const [search, setSearch] = useState("");
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [editing, setEditing] = useState<MemoryEntry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [context, setContext] = useState("");
  const [confidence, setConfidence] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMemories(memoryStore.list(bucket));
  }, [bucket]);

  const handleSearch = async () => {
    if (search.trim()) {
      const results = await memoryStore.search(search, 50, bucket);
      setMemories(results);
    } else {
      setMemories(memoryStore.list(bucket));
    }
  };

  const startEdit = (entry: MemoryEntry) => {
    setEditing(entry);
    setContent(entry.content);
    setMood(entry.mood ?? "");
    setContext(entry.context ?? "");
    setConfidence(entry.confidence !== undefined ? String(entry.confidence) : "");
  };

  const submitEdit = async () => {
    if (!editing) return;
    await memoryStore.update(bucket, editing.id, {
      content,
      mood: mood || undefined,
      context: context || undefined,
      confidence: confidence ? Number(confidence) : undefined,
    });
    setEditing(null);
    setMemories(memoryStore.list(bucket));
  };

  const handleDelete = (id: string) => {
    memoryStore.delete(bucket, id);
    setMemories(memoryStore.list(bucket));
  };

  const handleExport = () => {
    try {
      const data = memoryStore.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'memories.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Backup failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      memoryStore.importAll(data);
      setMemories(memoryStore.list(bucket));
      toast({ title: 'Restore complete', description: 'Memories imported.' });
    } catch (err) {
      toast({
        title: 'Restore failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Memories</h2>
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={bucket} onValueChange={(v) => setBucket(v as MemoryBucket)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Bucket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semantic">Semantic</SelectItem>
            <SelectItem value="episodic">Episodic</SelectItem>
            <SelectItem value="procedural">Procedural</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memories"
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outline" onClick={handleExport}>
          Backup
        </Button>
        <Button variant="outline" onClick={handleImportClick}>
          Restore
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead>Mood</TableHead>
            <TableHead>Context</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memories.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="max-w-xs truncate">{m.content}</TableCell>
              <TableCell>{m.mood}</TableCell>
              <TableCell>{m.context}</TableCell>
              <TableCell>{m.confidence ?? ""}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            focusChatInput();
          }
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setEditing(null);
            focusChatInput();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="mood">Mood</Label>
                <Input id="mood" value={mood} onChange={(e) => setMood(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="context">Context</Label>
                <Input id="context" value={context} onChange={(e) => setContext(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confidence">Confidence</Label>
                <Input
                  id="confidence"
                  type="number"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={submitEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
