import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase env vars");
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { answers } = body ?? {};

    const strategistPrompt = `You are a strategist creating a master plan for a user based on their onboarding answers. Return ONLY valid JSON matching this schema:
{
  "goals": [
    {
      "title": string,
      "description": string,
      "milestones": [
        {
          "title": string,
          "tasks": [
            { "title": string, "description": string }
          ]
        }
      ]
    }
  ],
  "habits": [
    { "title": string, "frequency": string, "trigger": string }
  ],
  "triggers": string[]
}`;

    interface QA {
      question: string;
      answer: string;
    }

    const userContent = Array.isArray(answers)
      ? (answers as QA[])
          .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
          .join("\n")
      : "";

    const messages = [
      { role: "system", content: strategistPrompt },
      { role: "user", content: userContent },
    ];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "o4-mini-2025-04-16", messages }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("OpenAI error", resp.status, errText);
      return new Response(
        JSON.stringify({ error: "Upstream error", status: resp.status, detail: errText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await resp.json();
    const planText = data?.choices?.[0]?.message?.content ?? "{}";

    interface Plan {
      goals?: {
        title: string;
        description?: string;
        milestones?: {
          title: string;
          tasks?: { title: string; description?: string }[];
        }[];
      }[];
      habits?: { title: string; frequency?: string; trigger?: string }[];
      triggers?: string[];
    }

    let plan: Plan;
    try {
      plan = JSON.parse(planText) as Plan;
    } catch {
      const match = planText.match(/\{[\s\S]*\}/);
      if (match) {
        plan = JSON.parse(match[0]) as Plan;
      } else {
        throw new Error("Invalid JSON from model");
      }
    }

    const { error: mpError } = await supabase
      .from("master_plans")
      .insert({ user_id: auth.user.id, plan });
    if (mpError) throw mpError;

    if (Array.isArray(plan?.goals)) {
      for (const goal of plan.goals) {
        const { data: roadmap, error: rError } = await supabase
          .from("roadmaps")
          .insert({
            user_id: auth.user.id,
            title: goal.title,
            description: goal.description ?? null,
          })
          .select()
          .single();
        if (rError) throw rError;

        if (Array.isArray(goal.milestones)) {
          for (const milestone of goal.milestones) {
            if (Array.isArray(milestone.tasks)) {
              for (const task of milestone.tasks) {
                const { error: tError } = await supabase.from("tasks").insert({
                  user_id: auth.user.id,
                  roadmap_id: roadmap.id,
                  title: task.title,
                  description: task.description ?? null,
                });
                if (tError) throw tError;
              }
            }
          }
        }
      }
    }

    if (Array.isArray(plan?.habits)) {
      for (const habit of plan.habits) {
        const { error: hError } = await supabase.from("habits").insert({
          user_id: auth.user.id,
          title: habit.title,
          frequency: habit.frequency ?? null,
          trigger: habit.trigger ?? null,
        });
        if (hError) throw hError;
      }
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-plan error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
