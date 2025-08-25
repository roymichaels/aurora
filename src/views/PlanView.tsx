import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "@/integrations/db";
import { useTonSession } from "@/hooks/useTonSession";
import useWeeklyReview from "@/hooks/useWeeklyReview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Mission { id: string; title: string; description: string | null }
interface KPI { id: string; name: string; target: number | null; current: number | null; unit: string | null }
interface Sprint { id: string; title: string; start_date: string | null; end_date: string | null }
interface Task { id: string; title: string; sprint_id: string }

export default function PlanView() {
  const { user } = useTonSession();
  const [params] = useSearchParams();
  const missionId = params.get("mission_id");

  const [mission, setMission] = useState<Mission | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useWeeklyReview(missionId);

  useEffect(() => {
    if (!user || !missionId) return;
    const fetchAll = async () => {
      const { data: missionData } = await db
        .from("missions")
        .select("id, title, description")
        .eq("id", missionId)
        .maybeSingle();
      setMission(missionData as Mission | null);

      const { data: kpiData } = await db
        .from("kpis")
        .select("id, name, target, current, unit")
        .eq("mission_id", missionId);
      setKpis((kpiData as KPI[]) || []);

      const { data: sprintData } = await db
        .from("sprints")
        .select("id, title, start_date, end_date")
        .eq("mission_id", missionId)
        .order("start_date", { ascending: true });
      setSprints((sprintData as Sprint[]) || []);

      const { data: taskData } = await db
        .from("tasks")
        .select("id, title, sprint_id")
        .eq("mission_id", missionId);
      setTasks((taskData as Task[]) || []);
    };
    fetchAll();
  }, [user, missionId]);

  const today = new Date().toISOString().slice(0, 10);
  const currentSprint = useMemo(() =>
    sprints.find((s) => s.start_date && s.end_date && s.start_date <= today && s.end_date >= today),
  [sprints, today]);

  const currentTasks = useMemo(() => tasks.filter((t) => t.sprint_id === currentSprint?.id), [tasks, currentSprint]);
  const upcoming = useMemo(() => sprints.filter((s) => s.start_date && s.start_date > today), [sprints, today]);

  return (
    <div className="container mx-auto px-4 py-6 grid gap-8">
      {mission && (
        <section className="grid gap-2">
          <h2 className="text-xl font-semibold">Mission Brief</h2>
          <p className="text-muted-foreground">{mission.description}</p>
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Key Performance Indicators</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.id} className="border">
              <CardHeader>
                <CardTitle className="text-sm font-medium">{k.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {k.current ?? 0}{k.unit ?? ""}
                </div>
                {k.target != null && (
                  <p className="text-xs text-muted-foreground">Target {k.target}{k.unit ?? ""}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {kpis.length === 0 && (
            <p className="text-sm text-muted-foreground">No KPIs defined.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Current Sprint Tasks</h2>
        <div className="grid gap-2">
          {currentTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks for current sprint.</p>
          )}
          {currentTasks.map((t) => (
            <div key={t.id} className="rounded border p-2 text-sm">
              {t.title}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Upcoming Milestones</h2>
        <div className="grid gap-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
          )}
          {upcoming.map((s) => (
            <div key={s.id} className="rounded border p-2 flex justify-between text-sm">
              <span>{s.title}</span>
              <span className="text-muted-foreground">{s.start_date} → {s.end_date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

