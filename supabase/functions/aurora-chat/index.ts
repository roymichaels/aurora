import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import brain from "../../../src/brain/brain/Brain.ts";
import { getFilterName } from "../../../src/brain/brain/filters.ts";

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

    const usedModel = model || "o4-mini-2025-04-16"; // cost-effective default

    const systemMessages = [
      { role: "system", content: brain.cognition.systemPrompt },
    ];

    if (brain.cognition.contextPrompt) {
      systemMessages.push({ role: "system", content: brain.cognition.contextPrompt });
    }

    systemMessages.push({ role: "system", content: `Behavior style: ${brain.behavior.style}` });

    const skillPrompt = brain.skills
      .map((s) => `${s.name}: ${s.description}`)
      .join("; ");
    if (skillPrompt) {
      systemMessages.push({ role: "system", content: `Available skills: ${skillPrompt}` });
    }

    const filterNames = brain.filters
      .map((f) => getFilterName(f))
      .filter((n): n is string => Boolean(n));
    if (filterNames.length > 0) {
      systemMessages.push({ role: "system", content: `Applied filters: ${filterNames.join(", ")}` });
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
    let content = data?.choices?.[0]?.message?.content ?? "Okay.";

    for (const filter of brain.filters) {
      content = filter(content);
    }

    return new Response(JSON.stringify({ content }), {
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
