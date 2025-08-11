import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startOfTodayISO } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  progressPercent: number;
}

export default function ShareCard({ open, onOpenChange, progressPercent }: Props) {
  const { user } = useSupabaseAuth();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [topTasks, setTopTasks] = useState<string[]>([]);

  const name = useMemo(() => {
    const email = user?.email || "";
    return email.split("@")[0] || "You";
  }, [user]);

  const mood = useMemo(() => {
    try {
      const m = localStorage.getItem('mood.last') || 'Calm';
      const map: Record<string, string> = { Stressed: '😰', Calm: '😌', Tired: '🥱', Confident: '💪' };
      return map[m] || '🙂';
    } catch { return '🙂'; }
  }, []);

  // Load streak, XP and today's top completed tasks when opened
  useEffect(() => {
    (async () => {
      if (!open || !user) return;
      try {
        const [{ data: stats }, { data: tasks }] = await Promise.all([
          supabase.from('user_stats').select('streak_count, total_xp').eq('user_id', user.id).maybeSingle(),
          supabase
            .from('tasks')
            .select('title, completed_at')
            .eq('user_id', user.id)
            .eq('status', 'done')
            .gte('completed_at', startOfTodayISO())
            .order('completed_at', { ascending: false })
            .limit(5),
        ]);
        setStreak((stats as any)?.streak_count ?? 0);
        setXp((stats as any)?.total_xp ?? 0);
        setTopTasks(((tasks ?? []) as any[]).map((t) => t.title).slice(0, 3));
      } catch (e) {
        console.error(e);
        setStreak(0); setXp(0); setTopTasks([]);
      }
    })();
  }, [open, user]);

  useEffect(() => {
    if (!open) { setImgUrl(null); return; }
    const el = nodeRef.current;
    if (!el) return;
    // Delay to ensure fonts/styles applied and data populated
    const t = setTimeout(async () => {
      try {
        const dataUrl = await htmlToImage.toPng(el, { pixelRatio: 2, backgroundColor: "#0f1113" });
        setImgUrl(dataUrl);
      } catch (e) { console.error(e); }
    }, 80);
    return () => clearTimeout(t);
  }, [open, streak, xp, topTasks]);

  const onDownload = async () => {
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = 'progress-card.png';
    a.click();
  };

  const onCopy = async () => {
    if (!imgUrl) return;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const navAny = navigator as any;
      if (navAny.clipboard && navAny.clipboard.write && window.ClipboardItem) {
        await navAny.clipboard.write([
          new window.ClipboardItem({ [blob.type]: blob })
        ]);
        toast({ title: 'Copied', description: 'Image copied to clipboard.' });
      } else if (navigator.clipboard && (navigator as any).clipboard.writeText) {
        await (navigator as any).clipboard.writeText(imgUrl);
        toast({ title: 'Copied', description: 'Image URL copied to clipboard.' });
      } else {
        await onDownload();
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Copy failed', description: 'Could not copy image. Downloaded instead.' });
      await onDownload();
    }
  };

  const onShare = async () => {
    if (navigator.share && imgUrl) {
      try {
        const res = await fetch(imgUrl);
        const blob = await res.blob();
        const file = new File([blob], 'progress.png', { type: 'image/png' });
        await (navigator as any).share({ files: [file], title: 'My progress', text: 'Made with Your App' });
      } catch (e) { console.error(e); }
    } else {
      await onDownload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share your progress</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            ref={nodeRef}
            className="rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-lg"
            style={{ width: 640, maxWidth: '100%' }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold">{name}</div>
              <div className="text-2xl" aria-label="Mood">{mood}</div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">Today's Progress</div>
            {/* Accent gradient progress ring */}
            {(() => {
              const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)));
              const deg = clamped * 3.6;
              return (
                <div className="mt-4 mx-auto relative" style={{ width: 200, height: 200 }}>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(hsl(var(--primary)) ${deg}deg, hsl(var(--primary) / 0.12) 0deg)`,
                    }}
                  />
                  <div className="absolute inset-3 rounded-full bg-background/70 backdrop-blur-sm border border-border flex items-center justify-center">
                    <div className="text-4xl font-extrabold tabular-nums">{clamped}%</div>
                  </div>
                </div>
              );
            })()}

            {/* Streak + XP */}
            <div className="mt-5 flex items-end justify-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-extrabold tracking-tight">🔥 {streak}</div>
                <div className="text-xs text-muted-foreground">day streak</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Total XP</div>
                <div className="text-xl font-bold tabular-nums">{xp}</div>
              </div>
            </div>

            {/* Top completed tasks today */}
            {topTasks.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Today's Wins</div>
                <ul className="space-y-1 text-sm">
                  {topTasks.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>✅</span>
                      <span className="flex-1">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
              <img src="/favicon.ico" alt="Your App logo" width={16} height={16} />
              <span>Made with Your App</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={onDownload}>Download</Button>
            <Button variant="ghost" onClick={async () => {
              await onDownload();
              toast({ title: 'Instagram', description: 'Image downloaded. Open Instagram and post your card.' });
            }}>Instagram</Button>
            <Button variant="ghost" onClick={async () => {
              await onDownload();
              toast({ title: 'TikTok', description: 'Image downloaded. Open TikTok and upload your card.' });
            }}>TikTok</Button>
            <Button variant="ghost" onClick={() => {
              const text = encodeURIComponent('I just made progress! #MadeWithYourApp');
              window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
            }}>X</Button>
            <Button onClick={onShare}>Share</Button>
          </div>
          {imgUrl && (
            <img src={imgUrl} alt="Share preview" className="w-full rounded border border-border" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
