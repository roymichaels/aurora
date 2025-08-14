import { useEffect, useState } from "react";
import {
  memoryStore,
  type MemoryBucket,
  type MemoryEntry,
} from "@/memory/indexedDbMemory";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";

interface Props {
  bucket?: MemoryBucket;
}

export default function MemoryManager({ bucket = "semantic" }: Props) {
  const focusChatInput = useChatInputFocus();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [editing, setEditing] = useState<MemoryEntry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [context, setContext] = useState("");
  const [confidence, setConfidence] = useState("");

  useEffect(() => {
    setMemories(memoryStore.list(bucket));
  }, [bucket]);

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
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(m.id)}
                  >
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
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="mood">Mood</Label>
                <Input
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="context">Context</Label>
                <Input
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
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
