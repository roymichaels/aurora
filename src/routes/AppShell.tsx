import { Suspense, useEffect, useMemo } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { views, type ViewId } from "@/views/registry";
import { AnchoredChatBar } from "@/components/chat/AnchoredChatBar";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import BottomDock from "@/components/navigation/BottomDock";
import { TimerHudChip } from "@/components/navigation/TimerHudChip";
import ModalHost from "@/components/modals/ModalHost";
import { bus } from "@/utils/bus";
import { useViewNav } from "@/state/view";
import { useXPChime } from "@/hooks/useXPChime";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import useDailyCheckIn from "@/hooks/useDailyCheckIn";
import useWeeklyBrainBackup from "@/hooks/useWeeklyBrainBackup";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import AppHeader from "@/components/layout/AppHeader";
import { useUIStore } from "@/state/ui";

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
  useKeyboardOffset();

  useEffect(() => {
    document.documentElement.style.setProperty("--hud-h", "0px");
    document.documentElement.style.setProperty("--gap-h", "8px");
    document.documentElement.style.setProperty("--hud-gap", "var(--gap-h)");
  }, []);


  useEffect(() => {
    const off = bus.on('nav:view', ({ id, params }) => open(id as ViewId, params));
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
        voiceNote: 'voice',
        addNote: 'journal',
        openBrain: 'brain',
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
      const description = `Aurora OS — ${meta.label} room for focus, voice, and hypnosis.`;
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

  if (initializing) {
    return (
      <div className="relative min-h-svh w-screen grid place-items-center">
        <div className="os-bg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user && loc.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className={`relative min-h-svh room-${currentRoom}`} {...swipe}>
        <div className="os-bg" />
        <AppHeader />
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname + loc.search}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="aurora-app overflow-y-auto pt-[calc(var(--header-h)+var(--gap-h))] pb-[calc(var(--dock-h)+var(--gap-h)+var(--chatbar-h)+var(--kb-offset)+var(--safe-area-bottom))]"
          >
            <Suspense fallback={<div className="p-6 opacity-70">Loading…</div>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>

        <ModalHost />
        <BottomDock />
        <ChatDrawer />
        <AnchoredChatBar />
        <TimerHudChip />
      </div>
  );
}

