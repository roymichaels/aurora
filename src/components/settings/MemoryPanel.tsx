import { useEffect, useState } from "react";
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

export default function MemoryPanel() {
  const [bucket, setBucket] = useState<MemoryBucket>("semantic");
  const [search, setSearch] = useState("");
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [editing, setEditing] = useState<MemoryEntry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [context, setContext] = useState("");
  const [confidence, setConfidence] = useState("");

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

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
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
