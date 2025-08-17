import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";
import { Music, Pause, Play, Repeat, Volume2 } from "lucide-react";

type Props = {
  label?: string;
  buttonVariant?: "default" | "secondary" | "ghost" | "outline";
  buttonSize?: "default" | "sm" | "icon";
};

export function SoundControl({ label = "Sound", buttonVariant = "secondary", buttonSize = "sm" }: Props) {
  const audio = useBackgroundAudio();

  const categories = useMemo(() => {
    const cats = new Map<string, typeof audio.availableSounds>();
    audio.availableSounds.forEach((s) => {
      const key = s.category ?? "General";
      if (!cats.has(key)) cats.set(key, []);
      cats.get(key)!.push(s);
    });
    return Array.from(cats.entries());
  }, [audio.availableSounds]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={buttonSize} variant={buttonVariant} aria-label="Sound control">
          {buttonSize === "icon" ? <Music className="h-4 w-4" /> : label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Background sound</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Pick an ambience to play in the background. It persists across sessions.
          </div>

          {/* Sound list */}
          <div className="max-h-64 overflow-y-auto space-y-3">
            {audio.loading && <div className="text-sm">Loading sounds…</div>}
            {!audio.loading && categories.map(([cat, list]) => (
              <div key={cat}>
                <div className="text-xs font-medium mb-2">{cat}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {list.map((s) => (
                    <Button
                      key={s.id}
                      type="button"
                      onClick={async () => {
                        await audio.pickSound(s as any);
                        await audio.play();
                      }}
                      className={`w-full text-left p-3 rounded border border-border hover:bg-muted/40 smooth ${
                        audio.selectedSound?.id === s.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="font-medium text-sm">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.audio_url}</div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {!audio.loading && audio.availableSounds.length === 0 && (
              <div className="text-sm text-muted-foreground">No sounds available yet.</div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={audio.play} disabled={!audio.selectedSound}>
              <Play className="h-4 w-4 mr-2" /> Play
            </Button>
            <Button size="sm" variant="outline" onClick={audio.pause}>
              <Pause className="h-4 w-4 mr-2" /> Pause
            </Button>
            <Button size="sm" variant="ghost" onClick={() => audio.setLooping(!audio.loop)}>
              <Repeat className="h-4 w-4 mr-2" /> {audio.loop ? "Loop: On" : "Loop: Off"}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[audio.volume]}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
              onValueChange={(v) => audio.setVolume(v[0] ?? audio.volume)}
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(audio.volume * 100)}%</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
