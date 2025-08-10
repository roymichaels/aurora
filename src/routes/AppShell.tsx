import { Suspense, useEffect, useMemo } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { views } from "@/views/registry";
import { GameHUD } from "@/components/hud/GameHUD";
import { bus } from "@/utils/bus";
import { useViewNav } from "@/state/view";
import { useXPChime } from "@/hooks/useXPChime";
import { useSwipeNav } from "@/hooks/useSwipeNav";
export default function AppShell() {
  const loc = useLocation();
  const open = useViewNav();

  const currentRoom = useMemo(() => (views.find(v => loc.pathname.startsWith(v.path))?.id ?? "control"), [loc.pathname]);

  useXPChime();
  const swipe = useSwipeNav();

  useEffect(() => {
    const off = bus.on('nav:view', ({ id, params }) => open(id as any, params));
    return off;
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
  return (
    <div className={`relative min-h-svh room-${currentRoom}`} {...swipe}>
      <div className="os-bg" />
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname + loc.search}>
          {views.map((v) => (
            <Route
              key={v.id}
              path={v.path}
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
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AnimatePresence>

      
      <GameHUD />
    </div>
  );
}
