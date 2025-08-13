import { useEffect, useState } from "react";
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
  const { voiceId, setMode, setLocale } = useVoiceStore((s) => ({
    voiceId: s.voiceId,
    setMode: s.setMode,
    setLocale: s.setLocale,
  }));
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState("");
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);

  useEffect(() => {
    setLocale(navigator.language || "en-US");
  }, [setLocale]);

  const saveProfile = async () => {
    const data = { name, goals, voiceId };
    try {
      localStorage.setItem("persona-profile", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save profile", err);
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

  useEffect(() => {
    if (step === 2 && showVoiceSetup && voiceId) {
      setMode("cloned");
      next();
    }
  }, [voiceId, showVoiceSetup, step]);

  const disabled =
    (step === 0 && !name.trim()) ||
    (step === 1 && !goals.trim());

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
          {!showVoiceSetup ? (
            <>
              <p className="text-sm">Choose a voice option:</p>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowVoiceSetup(true)}>
                  Use my sample
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setMode("eleven-default");
                    next();
                  }}
                >
                  Use default voice
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    const mode = import.meta.env.VITE_ELEVEN_API_KEY
                      ? "eleven-default"
                      : "browser-tts";
                    setMode(mode);
                    next();
                  }}
                >
                  Skip for now
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">Record a short voice sample.</p>
              <VoiceSetup />
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowVoiceSetup(false)}
              >
                Back
              </Button>
            </>
          )}
        </div>
      )}
      {step < 2 && (
        <Button onClick={next} disabled={disabled}>
          Next
        </Button>
      )}
    </div>
  );
}

