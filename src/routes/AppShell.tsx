import { Suspense, useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { views, type ViewId } from "@/views/registry";
import { GameHUD } from "@/components/game/GameHUD";
import { FloatingAssistant } from "@/components/live/FloatingAssistant";
import { bus } from "@/utils/bus";
import { useViewNav } from "@/state/view";
import { useXPChime } from "@/hooks/useXPChime";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import ControlView from "@/views/ControlView";
export default function AppShell() {
  const { user, initializing } = useSupabaseAuth();
  const loc = useLocation();
  const open = useViewNav();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setOnboarded(!!data?.onboarded_at);
        });
    } else {
      setOnboarded(null);
    }
  }, [user]);

  const currentRoom = useMemo(() => {
    const match = views.find((v) => {
      const full = v.path ? `/app/${v.path}` : "/app";
      const prefix = full.replace(/:.*/, "");
      return loc.pathname.startsWith(prefix);
    });
    return match?.id ?? "control";
  }, [loc.pathname]);

  useXPChime();
  const swipe = useSwipeNav();

  useEffect(() => {
    const off = bus.on('nav:view', ({ id, params }: { id: ViewId; params?: Record<string, string> }) => open(id, params));
    return off;
  }, [open]);

  useEffect(() => {

    const onMos = (e: Event) => {
      const t = (e as CustomEvent).detail?.type as string | undefined;
      if (t === 'openBrowser') {
        const last = localStorage.getItem('lastBrowserUrl') || 'https://www.notion.so/';
        open('browser', { url: last });
        return;
      }
      const map: Record<string, ViewId> = {
        startFocus: 'focus',
        startHypnosis: 'hypno',
        voiceNote: 'voice',
        addNote: 'notes',
        openAnalyze: 'analyze',
        openMap: 'portal',
      };
      const vid = t ? map[t] : undefined;
      if (vid) open(vid);
    };
    window.addEventListener('mos', onMos);
    return () => {
      window.removeEventListener('mos', onMos);
    };
  }, [open]);

  useEffect(() => {
    const meta = views.find(v => loc.pathname.startsWith(v.path));
    if (meta) {
      document.title = `Aurora OS — ${meta.label}`;
      // SEO: update description and canonical
      const description = `Aurora OS — ${meta.label} room for focus, voice, hypnosis, and analytics.`;
      let md = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!md) {
        md = document.createElement('meta');
        md.name = 'description';
        document.head.appendChild(md);
      }
      md.content = description;

      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = window.location.origin + loc.pathname + loc.search;
    }
  }, [loc.pathname, loc.search]);

  if (initializing || (user && onboarded === null)) {
    return (
      <div className="relative min-h-svh w-screen grid place-items-center">
        <div className="os-bg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (onboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className={`relative min-h-svh room-${currentRoom}`} {...swipe}>
      <div className="os-bg" />
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname + loc.search}>
          <Route index element={<ControlView />} />
          {views.filter((v) => v.id !== "control").map((v) => (
            <Route
              key={v.id}
              path={v.path || undefined}
              index={v.path === "" ? true : undefined}
              element={
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="pb-[calc(var(--hud-h)+var(--hud-gap)+env(safe-area-inset-bottom))]"
                >
                  <Suspense fallback={<div className="p-6 opacity-70">Loading…</div>}>
                    <v.component />
                  </Suspense>
                </motion.div>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AnimatePresence>


      <FloatingAssistant task={null} onUpdated={() => {}} />
      <GameHUD />
    </div>
  );
}
