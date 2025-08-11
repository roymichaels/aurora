import { useEffect, useMemo, useState } from "react";
import GoalForm from "@/components/goals/GoalForm";
import TasksManager from "@/components/control/TasksManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";

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
  const [plan, setPlan] = useState<MasterPlan | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [habits, setHabits] = useState<DBHabit[]>([]);
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
    setPlan(planRecord?.plan ?? null);
    setRoadmaps((roadmapData as Roadmap[]) ?? []);
    setHabits((habitData as DBHabit[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const roadmapByTitle = useMemo(() => {
    const map: Record<string, string> = {};
    roadmaps.forEach((r: Roadmap) => { map[r.title] = r.id; });
    return map;
  }, [roadmaps]);

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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Master Plan</h1>
        <Button onClick={requestRevision} disabled={loading}>Request Revision</Button>
      </div>

      {plan ? (
        <div className="grid gap-8">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Goals</h2>
            {plan.goals?.map((g, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                <div>
                  <div className="font-medium">{g.title}</div>
                  {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
                </div>
                {g.milestones?.map((m, j) => (
                  <div key={j} className="ml-4 space-y-1">
                    <div className="font-medium">{m.title}</div>
                    {m.tasks && (
                      <ul className="list-disc ml-4">
                        {m.tasks.map((t, k) => (
                          <li key={k} className="text-sm">{t.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {roadmapByTitle[g.title] && (
                  <div className="mt-4">
                    <TasksManager roadmapId={roadmapByTitle[g.title]} />
                  </div>
                )}
              </div>
            ))}
            <div className="mt-4">
              <GoalForm />
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Habits</h2>
            {habits.length === 0 && <p className="text-sm text-muted-foreground">No habits yet.</p>}
            {habits.map(h => (
              <div key={h.id} className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <Input
                  value={h.title}
                  onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? { ...x, title: e.target.value } : x))}
                  onBlur={(e) => updateHabit(h.id, { title: e.target.value })}
                  placeholder="Habit title"
                />
                <Input
                  value={h.frequency ?? ""}
                  onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? { ...x, frequency: e.target.value } : x))}
                  onBlur={(e) => updateHabit(h.id, { frequency: e.target.value })}
                  placeholder="Frequency"
                />
                <Input
                  value={h.trigger ?? ""}
                  onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? { ...x, trigger: e.target.value } : x))}
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
    </div>
  );
}

