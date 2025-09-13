
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db";
import { Button } from "@/components/ui/button";
import { useNearSession } from "@/hooks/useNearSession";
import { toast } from "@/hooks/use-toast";

type Goal = {
  id: string;
  title: string;
  why: string | null;
  next_action: string | null;
  status: string;
  created_at: string;
};

async function fetchGoals() {
  const { data, error } = await db
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export default function GoalsList() {
  const { user } = useNearSession();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
    enabled: !!user,
    meta: {
      onError: (err: unknown) => {
        console.error("Goals list error", err);
      },
    },
  });

  const onDelete = async (id: string) => {
    const { error: delError } = await db.from("goals").delete().eq("id", id);
    if (delError) {
      toast({ title: "Delete failed", description: delError.message });
      return;
    }
    toast({ title: "Goal deleted" });
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  if (!user) {
    return <p className="text-sm text-muted-foreground">Sign in to view your goals.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading goals...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">Error loading goals.</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No goals yet. Create your first one above.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((g) => (
        <li key={g.id} className="glass-panel rounded-md p-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{g.title}</p>
            {g.why && <p className="text-xs text-muted-foreground mt-1">{g.why}</p>}
            {g.next_action && <p className="text-xs mt-1"><span className="text-muted-foreground">Next:</span> {g.next_action}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => onDelete(g.id)}>Delete</Button>
        </li>
      ))}
    </ul>
  );
}
