import { Suspense, useEffect, useMemo } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GameHUD } from "@/components/game/GameHUD";
import { AnchoredChatBar } from "@/components/chat/AnchoredChatBar";
import { PersistentDock } from "@/components/navigation/PersistentDock";
import { views, type ViewId } from "@/views/registry";
import { bus } from "@/utils/bus";
import { useViewNav } from "@/state/view";
import { useXPChime } from "@/hooks/useXPChime";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import useDailyCheckIn from "@/hooks/useDailyCheckIn";
import useWeeklyBrainBackup from "@/hooks/useWeeklyBrainBackup";

export default function AppShell() {
  const { user, initializing } = useSupabaseAuth();
  const loc = useLocation();
  const open = useViewNav();

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
  useDailyCheckIn();
  useWeeklyBrainBackup();

  useEffect(() => {
    const off = bus.on(
      "nav:view",
      ({ id, params }: { id: ViewId; params?: Record<string, string> }) => open(id, params)
    );
    return off;
  }, [open]);

  useEffect(() => {
    const onMos = (e: Event) => {
      const t = (e as CustomEvent).detail?.type as string | undefined;
      if (t === "openBrowser") {
        const last = localStorage.getItem("lastBrowserUrl") || "https://www.notion.so/";
        open("browser", { url: last });
        return;
      }
      const map: Record<string, ViewId> = {
        startFocus: "focus",
        startHypnosis: "hypno",
        voiceNote: "voice",
        addNote: "notes",
        openMap: "portal",
        openBrain: "brain",
      };
      const vid = t ? map[t] : undefined;
      if (vid) open(vid);
    };
    window.addEventListener("mos", onMos);
    return () => {
      window.removeEventListener("mos", onMos);
    };
  }, [open]);

  useEffect(() => {
    const meta = views.find((v) => loc.pathname.startsWith(v.path));
    if (meta) {
      document.title = `Aurora OS — ${meta.label}`;
      // SEO: update description and canonical
      const description = `Aurora OS — ${meta.label} room for focus, voice, and hypnosis.`;
      let md = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!md) {
        md = document.createElement("meta");
        md.name = "description";
        document.head.appendChild(md);
      }
      md.content = description;

      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = window.location.origin + loc.pathname + loc.search;
    }
  }, [loc.pathname, loc.search]);

  if (initializing) {
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

  return (
    <div className={`relative min-h-svh room-${currentRoom}`} {...swipe}>
      <div className="os-bg" />
      <main className="pt-[calc(var(--hud-h)+var(--hud-gap))] pb-[calc(var(--chatbar-h)+var(--dock-h)+env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname + loc.search}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<div className="p-6 opacity-70">Loading…</div>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <GameHUD />
      <AnchoredChatBar />
      <PersistentDock />
    </div>
  );
}

