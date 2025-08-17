import { Target, Waves, StickyNote, Mic, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { awardXPRemote } from "@/integrations/supabase/gameSync";
import FocusRunner from "@/nodes/FocusRunner";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";

const pods: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "focus", label: "Focus", icon: Target },
  { key: "hypno", label: "Hypno", icon: Waves },
  { key: "journal", label: "Journal", icon: StickyNote },
  { key: "voice", label: "Voice", icon: Mic },
];

type Track = {
  id: string;
  title: string;
  audio_url: string;
  description: string | null;
};

export function QuickPodsRow() {
  const focusChatInput = useChatInputFocus();

  const [focusOpen, setFocusOpen] = useState(false);
  const handleFocusOpenChange = (open: boolean) => {
    setFocusOpen(open);
    if (!open) focusChatInput();
  };

  // Journal
  const [noteOpen, setNoteOpen] = useState(false);
  const handleNoteOpenChange = (open: boolean) => {
    setNoteOpen(open);
    if (!open) focusChatInput();
  };
  const [noteText, setNoteText] = useState("");
  const saveNote = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast({ title: "Sign in required", description: "Connect Supabase to capture notes." });
      return;
    }
    if (!noteText.trim()) return;
    const { error } = await supabase.from("moments").insert({
      user_id: user.id,
      type: "text",
      content: noteText.trim(),
      folder: "Memories",
      tags: ["note"],
      visibility: "private",
    });
    if (error) {
      console.error(error);
      return;
    }
    toast({ title: "Saved", description: "Your note has been added to Archive." });
    setNoteText("");
    handleNoteOpenChange(false);
  };

  // Voice note
  const [voiceOpen, setVoiceOpen] = useState(false);
  const handleVoiceOpenChange = (open: boolean) => {
    setVoiceOpen(open);
    if (!open) focusChatInput();
  };
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    const authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) {
      toast({ title: "Sign in required", description: "Connect Supabase to record voice notes." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      setChunks([]);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) setChunks((prev) => [...prev, e.data]);
      };
      mr.onstop = async () => {
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const filePath = `${authUser!.id}/${Date.now()}.webm`;
          const { error: upErr } = await supabase.storage.from("voice-notes").upload(filePath, blob, { contentType: "audio/webm" });
          if (upErr) throw upErr;
          const { error: insErr } = await supabase.from("moments").insert({
            user_id: authUser!.id,
            type: "audio",
            content: "Voice note",
            storage_path: `voice-notes/${filePath}`,
            folder: "Memories",
            tags: ["voice"],
            visibility: "private",
          });
          if (insErr) throw insErr;
          toast({ title: "Saved", description: "Voice note added to Archive." });
        } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Could not save voice note." });
        } finally {
          setRecording(false);
          handleVoiceOpenChange(false);
          setElapsed(0);
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      mr.start();
      setRecorder(mr);
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000) as unknown as number;
    } catch (e) {
      console.error(e);
          toast({ title: "Microphone blocked", description: "Please allow microphone access." });
    }
  };

  const stopRecording = () => {
    try {
      recorder?.stop();
    } catch (e) {
      console.error(e);
    }
  };

  // Hypnosis
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const handleLibraryOpenChange = (open: boolean) => {
    setLibraryOpen(open);
    if (!open) focusChatInput();
  };
  const [preOpen, setPreOpen] = useState(false);
  const handlePreOpenChange = (open: boolean) => {
    setPreOpen(open);
    if (!open) focusChatInput();
  };
  const [mode, setMode] = useState<'focus' | 'calm' | 'confidence'>(() => (localStorage.getItem('hypnosis.mode') as 'focus' | 'calm' | 'confidence' | null) || 'focus');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setTracksLoading(true);
      const { data, error } = await supabase
        .from("tracks")
        .select("id, title, audio_url, description")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!mounted) return;
      if (error) console.error(error);
      setTracks((data ?? []) as Track[]);
      setTracksLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!preOpen) return;
    setCountdown(3);
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
            handlePreOpenChange(false);
            setLibraryOpen(true);
            (async () => {
              try {
                await awardXPRemote("hypnosis_session", 20, { mode });
              } catch (err) {
                console.error(err);
              }
            })();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [preOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('hypnosis.mode', mode);
    } catch (err) {
      console.error(err);
    }
  }, [mode]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {pods.map((p) => (
          <Button
            key={p.key}
            type="button"
            onClick={() => {
              if (p.key === 'focus') setFocusOpen(true);
              if (p.key === 'hypno') setPreOpen(true);
              if (p.key === 'journal') setNoteOpen(true);
              if (p.key === 'voice') setVoiceOpen(true);
            }}
            className="glass-panel rounded-xl p-4 flex flex-col items-center gap-2 hover-scale"
          >
            <p.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{p.label}</span>
          </Button>
        ))}
      </div>

      {/* Focus Runner */}
      <Dialog open={focusOpen} onOpenChange={handleFocusOpenChange}>
        <DialogContent className="sm:max-w-md p-0" onEscapeKeyDown={() => handleFocusOpenChange(false)}>
          {focusOpen && (
            <FocusRunner
              node={{ id: 'quick-focus', label: 'Focus Session', minutes: 25 }}
              onExit={() => handleFocusOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hypnosis pre-roll */}
      <Dialog open={preOpen} onOpenChange={handlePreOpenChange}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={() => handlePreOpenChange(false)}>
          <DialogHeader>
            <DialogTitle>Get ready</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Choose your mode for this session.</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={mode==='focus'? 'default' : 'outline'} onClick={() => setMode('focus')}>Focus</Button>
              <Button size="sm" variant={mode==='calm'? 'default' : 'outline'} onClick={() => setMode('calm')}>Calm</Button>
              <Button size="sm" variant={mode==='confidence'? 'default' : 'outline'} onClick={() => setMode('confidence')}>Confidence</Button>
            </div>
            <div className="h-2 w-full bg-muted rounded">
              <div className="h-2 bg-primary rounded" style={{ width: `${((3 - countdown) / 3) * 100}%` }} />
            </div>
            <div className="text-xs text-muted-foreground">Starting in {countdown}s…</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hypnosis library */}
      <Dialog open={libraryOpen} onOpenChange={handleLibraryOpenChange}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={() => handleLibraryOpenChange(false)}>
          <DialogHeader>
            <DialogTitle>Hypnosis library</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">Tap a track to open in a new tab and play.</div>
          <div className="max-h-72 overflow-y-auto grid gap-2">
            {tracksLoading && <div className="text-sm">Loading...</div>}
            {!tracksLoading && tracks.length === 0 && (
              <div className="text-sm text-muted-foreground">No tracks available.</div>
            )}
            {tracks.map((t) => (
              <a
                key={t.id}
                href={t.audio_url}
                target="_blank"
                rel="noreferrer"
                className="block p-3 rounded border border-border hover:bg-muted/50 smooth"
              >
                <div className="font-medium text-sm">{t.title}</div>
                {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice note */}
      <Dialog open={voiceOpen} onOpenChange={handleVoiceOpenChange}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={() => handleVoiceOpenChange(false)}>
          <DialogHeader>
            <DialogTitle>Record voice note</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {recording ? "Recording..." : "Tap record to start. Saved privately to Archive."}
            </div>
            <div className="text-sm font-mono tabular-nums">{String(Math.floor(elapsed/60)).padStart(2,'0')}:{String(elapsed%60).padStart(2,'0')}</div>
          </div>
          <div className="flex justify-end gap-2">
            {!recording ? (
              <Button onClick={startRecording}>Record</Button>
            ) : (
              <Button variant="destructive" onClick={stopRecording}>Stop & Save</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Journal */}
      <Dialog open={noteOpen} onOpenChange={handleNoteOpenChange}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={() => handleNoteOpenChange(false)}>
          <DialogHeader>
            <DialogTitle>Quick note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type a quick note..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleNoteOpenChange(false)}>Cancel</Button>
            <Button onClick={saveNote}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuickPodsRow;

