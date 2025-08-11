import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useVoiceStore } from "@/state/voice";

export default function VoiceSetup() {
  const { voiceId, setVoiceId } = useVoiceStore();
  const [uploading, setUploading] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("name", "user-voice");
      form.append("files", file);
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
        toast({ title: "Voice saved", description: "Custom voice ready." });
      } else {
        throw new Error("No voice id returned");
      }
    } catch (err) {
      console.error("voice upload", err);
      toast({
        title: "Upload failed",
        description: String(err),
        variant: "destructive" as any,
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      <p className="text-sm mb-2">
        {voiceId
          ? "Custom voice configured. Upload again to replace."
          : "Upload a short voice sample to clone your voice."}
      </p>
      <input
        type="file"
        accept="audio/*"
        onChange={onFileChange}
        disabled={uploading}
        className="mb-2"
      />
      {voiceId && (
        <div className="text-xs text-muted-foreground break-all">Voice ID: {voiceId}</div>
      )}
    </div>
  );
}
