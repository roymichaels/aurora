import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import brain from "../../../src/brain/Brain.ts";
import { getFilterName } from "../../../src/brain/filters.ts";
import { UserProfile } from "../../../src/data/profile.ts";
import { analyzeSentiment } from "../../../src/utils/sentiment.ts";
import { buildPrompt } from "../../../core/prompt.ts";


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
    const body = await req.json().catch(() => ({}));
    const { messages, prompt, model } = body ?? {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase env vars");
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const { data: auth } = await supabase.auth.getUser();
    let profile: UserProfile | null = null;
    if (auth.user) {
      const { data } = await supabase
        .from("profiles")
        .select("persona")
        .eq("id", auth.user.id)
        .single();
      profile = (data?.persona as UserProfile) ?? null;
    }

    const usedModel = model || "o4-mini-2025-04-16"; // cost-effective default

    const filterNames = brain.filters
      .map((f) => getFilterName(f))
      .filter((n): n is string => Boolean(n));
    const skills = brain.skills.map((s) => `${s.name}: ${s.description}`);

    const personaFields = profile ? (({ history, ...rest }) => rest)(profile) : {};

    const builtPrompt = buildPrompt(
      personaFields,
      brain.cognition.systemPrompt,
      [],
      brain.behavior.style,
      skills,
      filterNames,
    );

    const systemMessages = [
      { role: "system", content: builtPrompt },
    ];

    if (brain.cognition.contextPrompt) {
      systemMessages.push({ role: "system", content: brain.cognition.contextPrompt });
    }

    const payload = messages && Array.isArray(messages)
      ? { model: usedModel, messages: [...systemMessages, ...messages] }
      : {
          model: usedModel,
          messages: [
            ...systemMessages,
            { role: "user", content: typeof prompt === "string" ? prompt : String(prompt) },
          ],
        };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("OpenAI error", resp.status, errText);
      return new Response(JSON.stringify({ error: "Upstream error", status: resp.status, detail: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    let content = data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      console.error("Empty model response", data);
      return new Response(
        JSON.stringify({ error: "Empty response from model" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    for (const filter of brain.filters) {
      content = filter(content);
    }

    const sentiment = analyzeSentiment(content);

    return new Response(JSON.stringify({ content, sentiment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("aurora-chat error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
