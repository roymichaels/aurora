
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { awardXPRemote } from "@/integrations/supabase/gameSync";
import { useEffect, useRef, useState } from "react";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";

export type RegisteredQuickAction = {
  id: string;
  label: string;
  onTrigger: () => void;
};

const registeredQuickActions: RegisteredQuickAction[] = [];

export function registerQuickAction(action: RegisteredQuickAction) {
  registeredQuickActions.push(action);
}

type Task = {
  id: string;
};


type Track = {
  id: string;
  title: string;
  audio_url: string;
  description: string | null;
};

export function QuickActionsBar({ currentTask }: { currentTask: Task | null }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [extras, setExtras] = useState<RegisteredQuickAction[]>([]);
  const focusChatInput = useChatInputFocus();
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
    setExtras([...registeredQuickActions]);
  }, []);

  // Notes
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const saveNote = async () => {
    if (!(await supabase.auth.getUser()).data.user) {
      toast({ title: "Sign in required", description: "Connect Supabase to capture notes." });
      return;
    }
    if (!noteText.trim()) return;
    const { error } = await supabase.from("moments").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      type: "text",
      content: noteText.trim(),
      folder: "Memories",
      tags: currentTask ? ["note", "task", currentTask.id] : ["note"],
      visibility: "private",
    });
    if (error) {
      console.error(error);
      return;
    }
    toast({ title: "Saved", description: "Your note has been added to Archive." });
    setNoteText("");
    setNoteOpen(false);
  };

  // Voice note recording
  const [voiceOpen, setVoiceOpen] = useState(false);
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
            tags: currentTask ? ["voice", "task", currentTask.id] : ["voice"],
            visibility: "private",
          });
          if (insErr) throw insErr;
          toast({ title: "Saved", description: "Voice note added to Archive." });
        } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Could not save voice note." });
        } finally {
          setRecording(false);
          setVoiceOpen(false);
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
    } catch {}
  };

  // Hypnosis pre-roll and library
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [preOpen, setPreOpen] = useState(false);
  const [mode, setMode] = useState<'focus' | 'calm' | 'confidence'>(() => (localStorage.getItem('hypnosis.mode') as any) || 'focus');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!preOpen) return;
    setCountdown(3);
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          setPreOpen(false);
          setLibraryOpen(true);
          // Award XP for starting a hypnosis session
          (async () => {
            try {
              await awardXPRemote("hypnosis_session", 20, { mode });
            } catch {}
          })();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [preOpen]);

  useEffect(() => {
    try { localStorage.setItem('hypnosis.mode', mode); } catch {}
  }, [mode]);

  return (
    <div
      className="glass-panel rounded-xl p-3 elev flex flex-wrap items-center gap-2 sm:gap-3 pb-safe"
      style={{ height: `calc(100% + env(safe-area-inset-bottom))` }}
    >
      {/* Hypnosis quick-play */}
      <Button size="sm" onClick={() => setPreOpen(true)}>Start Hypnosis</Button>

      {extras.map((a) => (
        <Button key={a.id} size="sm" variant="ghost" onClick={a.onTrigger}>
          {a.label}
        </Button>
      ))}

      {/* Pre-roll dialog */}
      <Dialog
        open={preOpen}
        onOpenChange={(v) => {
          setPreOpen(v);
          if (!v) focusChatInput();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setPreOpen(false);
            focusChatInput();
          }}
        >
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

      {/* Library dialog */}
      <Dialog
        open={libraryOpen}
        onOpenChange={(v) => {
          setLibraryOpen(v);
          if (!v) focusChatInput();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setLibraryOpen(false);
            focusChatInput();
          }}
        >
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

      {/* Voice Note */}
      <Dialog
        open={voiceOpen}
        onOpenChange={(v) => {
          setVoiceOpen(v);
          if (!v) focusChatInput();
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">Voice Note</Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setVoiceOpen(false);
            focusChatInput();
          }}
        >
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

      {/* Notes */}
      <Dialog
        open={noteOpen}
        onOpenChange={(v) => {
          setNoteOpen(v);
          if (!v) focusChatInput();
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">Notes</Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setNoteOpen(false);
            focusChatInput();
          }}
        >
          <DialogHeader>
            <DialogTitle>Quick note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type a quick note..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={saveNote}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
