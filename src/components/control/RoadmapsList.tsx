import { Button } from "@/components/ui/button";

export type RoadmapItem = {
  id: string;
  title: string;
  color: string | null;
  status: string;
};

export default function RoadmapsList({
  items,
  selectedId,
  onSelect,
  onSetActive,
  onRename,
  onDelete,
}: {
  items: RoadmapItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSetActive: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">Your Roadmaps</div>
      <div className="grid gap-2">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No roadmaps yet. Create one above.</div>
        )}
        {items.map((r) => (
          <div key={r.id} className={`rounded-lg border border-border p-2 flex items-center justify-between gap-2 ${selectedId===r.id? 'bg-muted/30' : ''}`}>
            <Button onClick={()=> onSelect(r.id)} type="button" className="text-left flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: r.color ?? 'hsl(var(--primary))' }} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.status === 'active' ? 'Active' : 'Paused'}</div>
              </div>
            </Button>
            <div className="flex items-center gap-1.5">
              {r.status !== 'active' && (
                <Button size="sm" variant="soft" onClick={()=> onSetActive(r.id)}>Set Active</Button>
              )}
              <Button size="sm" variant="outline" onClick={()=> onRename(r.id)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={()=> onDelete(r.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
