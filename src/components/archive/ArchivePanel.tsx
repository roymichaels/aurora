import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { db } from "@/integrations/db";
import { createSignedUrl } from "@/integrations/storage";
import { useQuery } from "@tanstack/react-query";
import { PanelHeaderUnified } from "@/components/layout/PanelHeaderUnified";
// Basic types for archive entities
type Moment = {
  id: string;
  type: string;
  content: string | null;
  storage_path: string | null;
  folder: string | null;
  tags: string[] | null;
  created_at: string;
};

type Idea = {
  id: string;
  content: string;
  created_at: string;
};

type Analysis = {
  id: string;
  framework: string;
  created_at: string;
};

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function ArchivePanel() {
  // Fetch user's moments (RLS limits to current user)
  const { data: moments, isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ["moments"],
    queryFn: async () => {
      const { data, error } = await db
        .from("moments")
        .select("id, type, content, storage_path, folder, tags, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Moment[];
    },
  });

  // Fetch ideas (if table exists and RLS permits)
  const { data: ideas, isLoading: ideasLoading, error: ideasError } = useQuery<Idea[]>({
    queryKey: ["ideas"],
    queryFn: async () => {
      const { data, error } = await db
        .from("ideas")
        .select("id, content, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Idea[];
    },
  });

  // Fetch analyses (if table exists and RLS permits)
  const { data: analyses, isLoading: analysesLoading, error: analysesError } = useQuery<Analysis[]>({
    queryKey: ["analyses"],
    queryFn: async () => {
      const { data, error } = await db
        .from("analyses")
        .select("id, framework, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Analysis[];
    },
  });

  // Build signed URLs for audio moments stored in cloud storage
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      if (!moments) return;
      const candidates = moments.filter((m) => m.type === "audio" && m.storage_path);
      const entries: [string, string][] = [];
      for (const m of candidates) {
        const sp = m.storage_path as string; // e.g. "voice-notes/userId/filename.webm" or "bucket/path"
        const [bucket, ...rest] = sp.split("/");
        const path = rest.join("/");
        if (!bucket || !path) continue;
        const { data, error } = await createSignedUrl(bucket, path, 60 * 60);
        if (!error && data?.signedUrl) {
          entries.push([m.id, data.signedUrl]);
        }
      }
      if (entries.length) {
        setAudioUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();
  }, [moments]);

  return (
    <section className="w-full h-full flex flex-col">
      <PanelHeaderUnified title="Archive" subtitle="Your organized memories and references" />

      <main className="flex-1 min-h-0 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        <div className="glass-panel rounded-xl p-4 elev h-full flex flex-col">
          <Tabs defaultValue="moments" className="flex-1 flex flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="moments">Moments</TabsTrigger>
              <TabsTrigger value="ideas">Ideas</TabsTrigger>
              <TabsTrigger value="analyses">Analyses</TabsTrigger>
            </TabsList>

            <TabsContent value="moments" className="flex-1 min-h-0">
              {momentsLoading && <div className="text-sm text-muted-foreground">Loading moments...</div>}
              {!momentsLoading && (!moments || moments.length === 0) && (
                <div className="text-sm text-muted-foreground">No moments yet. Capture notes or voice in Live.</div>
              )}
              {!momentsLoading && moments && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1" style={{ maxHeight: "calc(100% - 0.5rem)" }}>
                  {moments.map((m) => (
                    <article key={m.id} className="rounded-xl border border-border p-3 hover:bg-muted/40 smooth">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.type}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                      </div>
                      {m.type === "text" && (
                        <p className="mt-2 text-sm whitespace-pre-wrap">{m.content}</p>
                      )}
                      {m.type === "audio" && (
                        <div className="mt-2">
                          {audioUrls[m.id] ? (
                            <audio controls src={audioUrls[m.id]} className="w-full" />
                          ) : (
                            <div className="text-xs text-muted-foreground">Preparing audio...</div>
                          )}
                          {m.content && <p className="text-xs text-muted-foreground mt-2">{m.content}</p>}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {m.folder && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground/80">{m.folder}</span>
                        )}
                        {(m.tags ?? []).map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-foreground/80">{t}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ideas" className="flex-1 min-h-0">
              {ideasLoading && <div className="text-sm text-muted-foreground">Loading ideas...</div>}
              {ideasError && (
                <div className="text-sm text-muted-foreground">Ideas unavailable right now.</div>
              )}
              {!ideasLoading && !ideasError && (!ideas || ideas.length === 0) && (
                <div className="text-sm text-muted-foreground">No ideas captured yet.</div>
              )}
              {!ideasLoading && !ideasError && ideas && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1" style={{ maxHeight: "calc(100% - 0.5rem)" }}>
                  {ideas.map((i) => (
                    <article key={i.id} className="rounded-xl border border-border p-3 hover:bg-muted/40 smooth">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Idea</span>
                        <span className="text-xs text-muted-foreground">{formatDate(i.created_at)}</span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{i.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analyses" className="flex-1 min-h-0">
              {analysesLoading && <div className="text-sm text-muted-foreground">Loading analyses...</div>}
              {analysesError && (
                <div className="text-sm text-muted-foreground">Analyses unavailable right now.</div>
              )}
              {!analysesLoading && !analysesError && (!analyses || analyses.length === 0) && (
                <div className="text-sm text-muted-foreground">No analyses saved yet.</div>
              )}
              {!analysesLoading && !analysesError && analyses && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1" style={{ maxHeight: "calc(100% - 0.5rem)" }}>
                  {analyses.map((a) => (
                    <article key={a.id} className="rounded-xl border border-border p-3 hover:bg-muted/40 smooth">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{a.framework}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Result saved to Archive.</p>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </section>
  );
}
