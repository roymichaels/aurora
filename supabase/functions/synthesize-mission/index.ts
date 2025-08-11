import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deriveRevenueTargets, funnelBacksolve } from "../../../app/engines/targets.ts";
import { pickStrategies } from "../../../app/engines/strategies.ts";
import { buildRoadmap } from "../../../app/engines/roadmap.ts";
import type { Scope } from "../../../app/types/mission.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  user_id: string;
  scope: Scope;
  title: string;
  description?: string;
  start: string; // ISO
  end: string;   // ISO
  revenue: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase env vars");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const { user_id, scope, title, description, start, end, revenue } = body;
    if (!user_id || !scope || !title || !start || !end || typeof revenue !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Target derivation
    const targets = deriveRevenueTargets(revenue, new Date(start), new Date(end));
    const months = targets.length;
    const monthlyTarget = targets[0]?.revenue ?? 0;
    const funnel = funnelBacksolve(monthlyTarget);

    // Insert mission
    const { data: mission, error: mErr } = await supabase
      .from("missions")
      .insert({ user_id, scope, title, description: description ?? null })
      .select()
      .single();
    if (mErr) throw mErr;

    const strategies = pickStrategies([scope]);
    for (const strat of strategies) {
      // goal per strategy
      const { data: goal, error: gErr } = await supabase
        .from("goals")
        .insert({ user_id, mission_id: mission.id, title: strat.title })
        .select()
        .single();
      if (gErr) throw gErr;

      // KPIs
      for (const k of strat.kpis) {
        const { error: kErr } = await supabase.from("kpis").insert({
          user_id,
          goal_id: goal.id,
          name: k.name,
          target: k.target ?? null,
          unit: k.unit ?? null,
        });
        if (kErr) throw kErr;
      }

      // Milestones
      const milestoneIds: string[] = [];
      for (const m of strat.milestones) {
        const { data: ms, error: msErr } = await supabase
          .from("milestones")
          .insert({ user_id, goal_id: goal.id, title: m.title, description: m.description ?? null })
          .select()
          .single();
        if (msErr) throw msErr;
        milestoneIds.push(ms.id);
      }

      // Build roadmap for timing and tasks
      const roadmap = buildRoadmap(end, strat.id, 14);

      // Associate all sprints with first milestone
      if (milestoneIds[0]) {
        const sprintIds: string[] = [];
        for (const s of roadmap.sprints) {
          const { data: sprint, error: sErr } = await supabase
            .from("sprints")
            .insert({
              user_id,
              milestone_id: milestoneIds[0],
              title: `Sprint ${s.start.slice(0,10)}`,
              start_date: s.start.slice(0,10),
              end_date: s.end.slice(0,10),
            })
            .select()
            .single();
          if (sErr) throw sErr;
          sprintIds.push(sprint.id);
        }
        if (sprintIds[0]) {
          for (const t of roadmap.tasks) {
            const { error: tErr } = await supabase
              .from("tasks")
              .insert({ user_id, sprint_id: sprintIds[0], title: t.title });
            if (tErr) throw tErr;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ mission_id: mission.id, months, monthlyTarget, funnel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("synthesize-mission error", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

