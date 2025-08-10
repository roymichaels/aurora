import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { views } from "@/views/registry";
import { useViewNav } from "@/state/view";

export function useSwipeNav(threshold = 60) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startT = useRef(0);
  const loc = useLocation();
  const nav = useViewNav();

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    startT.current = Date.now();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    const dt = Date.now() - startT.current;
    if (dt > 600) return;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

    const paths = views.map((v) => {
      const full = v.path ? `/app/${v.path}` : "/app";
      return full.replace(/:.*/, "");
    });
    const idx = paths.findIndex((p) => loc.pathname.startsWith(p));
    if (idx === -1) return;

    let nextIdx = idx;
    if (dx < 0) nextIdx = Math.min(paths.length - 1, idx + 1); // swipe left → next
    else nextIdx = Math.max(0, idx - 1); // swipe right → prev

    if (nextIdx !== idx) {
      const next = views[nextIdx];
      nav(next.id);
    }
  };

  return { onTouchStart, onTouchEnd } as const;
}
