import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import VoiceSetup from "@/components/VoiceSetup";
import { useVoiceStore } from "@/state/voice";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const voiceId = useVoiceStore((s) => s.voiceId);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState("");

  const saveProfile = async () => {
    const data = { name, goals, voiceId };
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.resolve("persona", "profile.json");
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Failed to save profile.json", err);
    }
    if (user) {
      await supabase
        .from("profiles")
        .update({
          persona: { name, goals, voiceId },
          onboarded_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  };

  const next = async () => {
    if (step === 2) {
      await saveProfile();
      navigate("/app");
    } else {
      setStep((s) => s + 1);
    }
  };

  const disabled =
    (step === 0 && !name.trim()) ||
    (step === 1 && !goals.trim()) ||
    (step === 2 && !voiceId);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-4 p-4">
      {step === 0 && (
        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm">What's your name?</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      {step === 1 && (
        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm">What are your goals?</p>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            className="resize-none"
          />
        </div>
      )}
      {step === 2 && (
        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm">Record a short voice sample.</p>
          <VoiceSetup />
        </div>
      )}
      <Button onClick={next} disabled={disabled}>
        {step < 2 ? "Next" : "Finish"}
      </Button>
    </div>
  );
}

