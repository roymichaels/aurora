import { useEffect, useMemo, useState } from "react";
import GoalForm from "@/components/goals/GoalForm";
import TasksManager from "@/components/control/TasksManager";
import HabitTracker from "@/components/habits/HabitTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";
import { usePlanUpdater } from "@/hooks/usePlanUpdater";
import { UserProfile } from "@/data/profile";
import { useHabitStore } from "@/state/habits";

interface PlanTask {
  title: string;
  description?: string;
}

interface PlanMilestone {
  title: string;
  tasks?: PlanTask[];
}

interface PlanGoal {
  title: string;
  description?: string;
  milestones?: PlanMilestone[];
}

interface PlanHabit {
  title: string;
  frequency?: string;
  trigger?: string;
}

interface MasterPlan {
  goals?: PlanGoal[];
  habits?: PlanHabit[];
  plan_versions?: MasterPlan[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
}

interface DBHabit {
  id: string;
  title: string;
  frequency: string | null;
  trigger: string | null;
  status: string | null;
}

export default function MasterPlanView() {
  const { user } = useSupabaseAuth();
  const [dbPlan, setDbPlan] = useState<MasterPlan | null>(null);
  const { plan: plan, update } = usePlanUpdater(dbPlan as any);
  const [profile, setProfile] = useState<UserProfile>({ history: [] });
  const [editField, setEditField] = useState<"goals" | "habits" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [versionIndex, setVersionIndex] = useState(-1);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [dbHabits, setDbHabits] = useState<DBHabit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: planData }, { data: roadmapData }, { data: habitData }] = await Promise.all([
      supabase
        .from("master_plans")
        .select("plan")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("roadmaps")
        .select("id, title, description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("habits")
        .select("id, title, frequency, trigger, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    const planRecord = planData as { plan: MasterPlan } | null;
    if (planRecord?.plan) {
      setDbPlan({ ...planRecord.plan, plan_versions: (planRecord.plan as any).plan_versions ?? [] });
    } else {
      setDbPlan(null);
    }
    setRoadmaps((roadmapData as Roadmap[]) ?? []);
    const dbH = (habitData as DBHabit[]) ?? [];
    setDbHabits(dbH);
    useHabitStore.getState().setHabits(
      dbH.map((h) => ({
        id: h.id,
        title: h.title,
        frequency: h.frequency === "weekly" ? "weekly" : "daily",
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  useEffect(() => {
    if (plan) {
      const goalsStr = plan.goals?.map((g: any) => g.title ?? g.name).join("\n") ?? "";
      const habitsStr = plan.habits?.map((h: any) => h.title ?? h.name).join("\n") ?? "";
      setProfile((p) => ({ ...p, goals: goalsStr, habits: habitsStr }));
    }
  }, [plan]);

  const roadmapByTitle = useMemo(() => {
    const map: Record<string, string> = {};
    roadmaps.forEach((r: Roadmap) => { map[r.title] = r.id; });
    return map;
  }, [roadmaps]);

  const openEdit = (field: "goals" | "habits") => {
    setEditField(field);
    setEditValue((profile as any)[field] ?? "");
  };

  const handleSaveEdit = () => {
    if (!editField) return;
    const newProfile: UserProfile = {
      ...profile,
      [editField]: editValue,
      history: [
        ...profile.history,
        {
          question: `Updated ${editField}`,
          answer: editValue,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    update(profile, newProfile);
    setProfile(newProfile);
    setEditField(null);
  };

  const updateHabit = async (id: string, fields: { title?: string; frequency?: string; trigger?: string }) => {
    if (!user) { toast({ title: "Sign in required", description: "Connect Supabase to edit habits." }); return; }
    const { error } = await supabase
      .from("habits")
      .update(fields)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) { console.error(error); toast({ title: "Error", description: "Could not update habit." }); }
    else toast({ title: "Saved", description: "Habit updated." });
    await fetchData();
  };

  const requestRevision = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Connect Supabase to generate." }); return; }
    setLoading(true);
    const { data: answersData, error: answersError } = await supabase
      .from("onboarding_answers")
      .select("question, answer")
      .eq("user_id", user.id);

    if (answersError) {
      console.error(answersError);
      toast({ title: "Error", description: "Could not fetch onboarding answers." });
      setLoading(false);
      return;
    }

    const body: { answers: { question: string; answer: string }[]; plan?: MasterPlan } = {
      answers: (answersData as { question: string; answer: string }[]) ?? [],
    };
    if (plan) {
      body.plan = plan;
    }

    const { error } = await supabase.functions.invoke("generate-plan", { body });
    if (error) { console.error(error); toast({ title: "Error", description: "Could not regenerate plan." }); }
    else toast({ title: "Regenerated", description: "Plan regenerated." });
    await fetchData();
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground">Sign in to view your master plan.</p>
      </div>
    );
  }

  const displayPlan = versionIndex === -1 ? plan : plan?.plan_versions?.[versionIndex];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Master Plan</h1>
        <div className="flex items-center gap-2">
          {plan?.plan_versions && plan.plan_versions.length > 0 && (
            <Select value={versionIndex.toString()} onValueChange={(v) => setVersionIndex(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Version" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Current</SelectItem>
                {plan.plan_versions.map((_, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>Version {idx + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={requestRevision} disabled={loading}>Request Revision</Button>
        </div>
      </div>

      {displayPlan ? (
        <div className="grid gap-8">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Goals</h2>
              <Button variant="ghost" size="sm" onClick={() => openEdit("goals")}>Edit</Button>
            </div>
            {displayPlan.goals?.map((g: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                <div>
                  <div className="font-medium">{g.title ?? g.name}</div>
                  {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
                </div>
                {Array.isArray(g.milestones)
                  ? g.milestones.map((m: any, j: number) => (
                      <div key={j} className="ml-4 space-y-1">
                        <div className="font-medium">{m.title ?? m}</div>
                        {m.tasks && (
                          <ul className="list-disc ml-4">
                            {m.tasks.map((t: any, k: number) => (
                              <li key={k} className="text-sm">{t.title ?? t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  : g.milestones?.annual?.map((m: any, j: number) => (
                      <div key={j} className="ml-4 space-y-1">
                        <div className="font-medium">{m}</div>
                      </div>
                    ))}
                {roadmapByTitle[g.title ?? g.name] && (
                  <div className="mt-4">
                    <TasksManager roadmapId={roadmapByTitle[g.title ?? g.name]} />
                  </div>
                )}
              </div>
            ))}
            <div className="mt-4">
              <GoalForm />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Habits</h2>
              <Button variant="ghost" size="sm" onClick={() => openEdit("habits")}>Edit</Button>
            </div>
            {habits.length === 0 && <p className="text-sm text-muted-foreground">No habits yet.</p>}
            {habits.map(h => (
            <h2 className="text-xl font-semibold">Habits</h2>
            <HabitTracker />
            {dbHabits.length === 0 && <p className="text-sm text-muted-foreground">No habits yet.</p>}
            {dbHabits.map(h => (
              <div key={h.id} className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <Input
                  value={h.title}
                  onChange={(e) => setDbHabits(prev => prev.map(x => x.id === h.id ? { ...x, title: e.target.value } : x))}
                  onBlur={(e) => updateHabit(h.id, { title: e.target.value })}
                  placeholder="Habit title"
                />
                <Input
                  value={h.frequency ?? ""}
                  onChange={(e) => setDbHabits(prev => prev.map(x => x.id === h.id ? { ...x, frequency: e.target.value } : x))}
                  onBlur={(e) => updateHabit(h.id, { frequency: e.target.value })}
                  placeholder="Frequency"
                />
                <Input
                  value={h.trigger ?? ""}
                  onChange={(e) => setDbHabits(prev => prev.map(x => x.id === h.id ? { ...x, trigger: e.target.value } : x))}
                  onBlur={(e) => updateHabit(h.id, { trigger: e.target.value })}
                  placeholder="Trigger"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No plan generated yet.</p>
      )}

      <Dialog open={!!editField} onOpenChange={(v) => !v && setEditField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editField}</DialogTitle>
          </DialogHeader>
          <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} />
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

