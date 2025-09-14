import { useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useVoiceStore } from "@/state/voice";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Mic, Square } from "lucide-react";
import { db } from "@/integrations/db";
import { getNearUser } from "@/integrations/auth";

export default function VoiceSetup() {
  const {
    voiceId,
    setVoiceId,
    speed,
    setSpeed,
    pitch,
    setPitch,
    expression,
    setExpression,
    setMode,
    setLocale,
  } = useVoiceStore();
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uploadSample = async (file: Blob | File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("name", "user-voice");
      const f = file instanceof File ? file : new File([file], "sample.webm", { type: file.type || "audio/webm" });
      form.append("files", f);
      const resp = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": import.meta.env.VITE_ELEVEN_API_KEY || "",
        },
        body: form,
      });
      if (!resp.ok) throw new Error("Voice upload failed");
      const json = await resp.json();
      if (json?.voice_id) {
        setVoiceId(json.voice_id);
        setMode("cloned");
        setLocale(navigator.language || "en-US");
        try {
          const auth = await getNearUser();
          const uid = auth?.id;
          if (uid) {
            const { data: prof } = await db
              .from("profiles")
              .select("persona")
              .eq("id", uid)
              .single();
            const persona = (prof?.persona as any) || {};
            await db
              .from("profiles")
              .update({ persona: { ...persona, voiceId: json.voice_id } })
              .eq("id", uid);
          }
        } catch (e) {
          console.warn("Failed to save voiceId to profile", e);
        }
        toast({ title: "Voice saved", description: "Custom voice ready." });
      } else {
        throw new Error("No voice id returned");
      }
    } catch (err) {
      console.error("voice upload", err);
        toast({
          title: "Upload failed",
          description: String(err),
          variant: "destructive" as const,
        });
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadSample(file);
    if (e.target) e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        uploadSample(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      toast({ title: "Mic access denied", description: String(err), variant: "destructive" as const });
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      <p className="text-sm mb-2">
        {voiceId
          ? "Custom voice configured. Upload or record again to replace."
          : "Record or upload a short sample to clone your voice."}
      </p>
      <div className="flex items-center gap-2 mb-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={recording ? stopRecording : startRecording}
          disabled={uploading}
          className="gap-2"
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {recording ? "Stop" : "Record"}
        </Button>
        <input
          type="file"
          accept="audio/*"
          onChange={onFileChange}
          disabled={uploading}
        />
      </div>
      {voiceId && (
        <div className="text-xs text-muted-foreground break-all">Voice ID: {voiceId}</div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Speed</span>
            <span>{speed.toFixed(2)}</span>
          </div>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={[speed]}
            onValueChange={(v) => setSpeed(v[0])}
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Pitch</span>
            <span>{pitch.toFixed(2)}</span>
          </div>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={[pitch]}
            onValueChange={(v) => setPitch(v[0])}
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Expression</span>
            <span>{expression.toFixed(2)}</span>
          </div>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={[expression]}
            onValueChange={(v) => setExpression(v[0])}
          />
        </div>
      </div>
    </div>
  );
}
