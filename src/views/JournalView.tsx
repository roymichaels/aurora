import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ViewHeader from "@/components/view/ViewHeader";
import { Flame, Mic, MicOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceIO } from "@/voice/voiceio";
import { addJournal, createDatabase, type JournalEntry } from "@/state/db";
import { auroraChat } from "@/utils/auroraChat";

const moods = [
  { id: "good", label: "Good" },
  { id: "ok", label: "OK" },
  { id: "bad", label: "Bad" },
];

function calcStreak(entries: JournalEntry[]): number {
  const days = new Set(entries.map((e) => new Date(e.ts).toDateString()));
  let count = 0;
  const today = new Date();
  for (;;) {
    const day = new Date(today);
    day.setDate(today.getDate() - count);
    if (days.has(day.toDateString())) count++;
    else break;
  }
  return count;
}

export default function JournalView() {
  const [entry, setEntry] = useState("");
  const [lastEntry, setLastEntry] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [listening, setListening] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const voiceRef = useRef<VoiceIO | null>(null);

  useEffect(() => {
    voiceRef.current = new VoiceIO({
      onPartial: (t) => setEntry((e) => e + t),
      onFinal: (t) => setEntry((e) => e + t),
      onSpeakingChange: () => {
        /* noop */
        return;
      },
      onError: (err) =>
        toast({
          title: "Voice error",
          description: String(err),
          variant: "destructive",
        }),
    });
    return () => {
      try {
        voiceRef.current?.stopListening();
      } catch (e) {
        void e;
      }
    };
  }, []);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | undefined;
    createDatabase().then((db) => {
      sub = db.journal
        .find()
        .sort({ ts: "desc" })
        .limit(100).$
        .subscribe((docs) => {
          const filtered = docs.filter((d) => d.tags?.includes("journal"));
          setEntries(filtered.slice(0, 5));
          setStreak(calcStreak(filtered));
        });
    });
    return () => sub?.unsubscribe();
  }, []);

  const toggleMic = async () => {
    if (!voiceRef.current) return;
    try {
      if (!listening) {
        await voiceRef.current.startPushToTalk();
        setListening(true);
      } else {
        await voiceRef.current.stopListening();
        setListening(false);
      }
    } catch {
      toast({
        title: "Mic permission needed",
        description: "Please allow microphone access.",
        variant: "destructive",
      });
    }
  };

  const saveEntry = async () => {
    const content = entry.trim();
    if (!content) {
      toast({ title: "Empty entry", description: "Type or speak something first." });
      return;
    }
    await addJournal({
      id: crypto.randomUUID(),
      content,
      mood: mood || undefined,
      ts: Date.now(),
      tags: ["journal"],
    });
    setLastEntry(content);
    setEntry("");
    setMood(null);
    setShowSummary(true);
    toast({ title: "Saved", description: "Journal entry added." });
  };

  const writeSummary = async () => {
    setLoadingSummary(true);
    try {
      const { content } = await auroraChat([
        {
          role: "system",
          content: "Summarize the following journal entry in three bullet points.",
        },
        { role: "user", content: lastEntry },
      ]);
      await addJournal({
        id: crypto.randomUUID(),
        content,
        ts: Date.now(),
        tags: ["plan", "summary"],
      });
      toast({ title: "Plan updated", description: "Summary added to plan." });
    } catch {
      toast({ title: "Summary failed", description: "Could not generate summary." });
    } finally {
      setShowSummary(false);
      setLoadingSummary(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex items-start justify-between">
        <ViewHeader
          title="Journal"
          description="Record your thoughts and feelings."
        />
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
          <Flame className="w-4 h-4 text-destructive" />
          <span className="font-medium tabular-nums">{streak}</span>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <Textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="How are you feeling today?"
          />
          <div className="flex flex-wrap items-center gap-2">
            {moods.map((m) => (
              <Badge
                key={m.id}
                onClick={() => setMood(m.id)}
                variant={mood === m.id ? "default" : "outline"}
                className="cursor-pointer"
              >
                {m.label}
              </Badge>
            ))}
            <Button
              onClick={toggleMic}
              variant="secondary"
              size="sm"
              className="ml-auto gap-2"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {listening ? "Stop" : "Mic"}
            </Button>
            <Button onClick={saveEntry} size="sm" className="gap-2">
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {showSummary && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span>Want a 3-bullet summary?</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSummary(false)}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={writeSummary}
                disabled={loadingSummary}
              >
                {loadingSummary ? "..." : "Yes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Recent entries</h2>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        )}
        {entries.map((n) => (
          <Card key={n.ts}>
            <CardContent className="p-4 space-y-1">
                <div className="text-sm">{n.content}</div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{n.mood}</span>
                <span>{new Date(n.ts).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

