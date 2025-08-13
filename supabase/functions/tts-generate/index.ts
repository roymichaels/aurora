
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ELEVEN_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVEN_DEFAULT_VOICE_ID =
  Deno.env.get("ELEVENLABS_DEFAULT_VOICE_ID") ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel (stock voice)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ELEVEN_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryVoiceId = searchParams.get("voiceId") ?? undefined;
    const body = (await req.json().catch(() => ({}))) as {
      text?: string;
      voiceId?: string;
      modelId?: string;
      outputFormat?: string;
    };
    const {
      text,
      voiceId: bodyVoiceId,
      modelId = "eleven_turbo_v2_5",
      outputFormat = "mp3_44100_128",
    } = body;
    const voiceId = [bodyVoiceId, queryVoiceId].find(
      (v): v is string => typeof v === "string" && v.length > 0,
    ) ?? ELEVEN_DEFAULT_VOICE_ID;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
        output_format: outputFormat,
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => "");
      console.error("ElevenLabs error:", resp.status, errTxt);
      return new Response(JSON.stringify({ error: "TTS failed", detail: errTxt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await resp.arrayBuffer());
    const base64Audio = encodeBase64(buf);
    const contentType = resp.headers.get("Content-Type") || "audio/mpeg";

    return new Response(JSON.stringify({ audioBase64: base64Audio, contentType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("tts-generate error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
