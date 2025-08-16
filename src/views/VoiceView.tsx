import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Mic, MicOff, Save, Sparkles, Send } from "lucide-react";
import { useViewNav } from "@/state/view";
import { VoiceIO } from "@/voice/voiceio";

export default function VoiceView() {
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");
  const [listening, setListening] = useState(false);
  const voiceRef = useRef<VoiceIO | null>(null);
  const nav = useViewNav();

  useEffect(() => {
    voiceRef.current = new VoiceIO({
      onPartial: (t) => setPartial(t),
      onFinal: (t) => {
        setFinalText((prev) => (prev ? prev + "\n" : "") + t);
        setPartial("");
      },
      onSpeakingChange: () => {},
      onError: (err) => toast({ title: "Voice error", description: String(err), variant: "destructive" as any }),
    });
    return () => {
      try { voiceRef.current?.stopListening(); } catch {}
    };
  }, []);

  const togglePTT = async () => {
    if (!voiceRef.current) return;
    try {
      if (!listening) {
        await voiceRef.current.startPushToTalk();
        setListening(true);
      } else {
        await voiceRef.current.stopListening();
        setListening(false);
      }
    } catch (e) {
      toast({ title: "Mic permission needed", description: "Please allow microphone access.", variant: "destructive" as any });
    }
  };

  const saveNote = () => {
    const content = (finalText || partial).trim();
    if (!content) {
      toast({ title: "Nothing to save", description: "Speak first, then save." });
      return;
    }
    try {
      const key = "aurora.notes";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const note = { id: crypto.randomUUID(), title: content.slice(0, 42), body: content, tags: ["Voice"], createdAt: Date.now() };
      arr.unshift(note);
      localStorage.setItem(key, JSON.stringify(arr));
      toast({ title: "Saved to Notes", description: "+5 XP (demo)" });
    } catch {
      toast({ title: "Save failed", description: "Local storage unavailable", variant: "destructive" as any });
    }
  };


  return (
    <div className="container mx-auto px-4 py-6">
      <DialogHeader>
        <DialogTitle>Voice</DialogTitle>
        <DialogDescription>
          Press to talk. I’ll transcribe as you speak.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Live Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="glass-panel rounded-xl p-4 min-h-[180px]">
              {finalText && (
                <pre className="whitespace-pre-wrap text-sm opacity-90 mb-2">{finalText}</pre>
              )}
              <div className="text-sm opacity-70">{partial || (finalText ? "" : "Start speaking…")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={togglePTT} className="h-12 rounded-xl justify-start gap-2">
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {listening ? "Stop Listening" : "Push to Talk"}
            </Button>
            <Button variant="secondary" onClick={saveNote} className="justify-start gap-2">
              <Save className="w-4 h-4" /> Save to Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
