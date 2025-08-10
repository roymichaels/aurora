import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { quickSlots } from "@/game/hud/hud.data";
import { EvolvingSphere } from "@/components/effects/EvolvingSphere";
import { Mic, ChevronDown, ChevronUp } from "lucide-react";
import { useViewNav } from "@/state/view";
import { Link, useNavigate } from "react-router-dom";
import { views } from "@/views/registry";

export function GameHUD() {
  const stats = useGameStore((s) => s.stats);
  const open = useViewNav();
  const navigate = useNavigate();
  const actionToView: Record<string, any> = {
    startFocus: 'focus',
    startHypnosis: 'hypno',
    voiceNote: 'voice',
    addNote: 'notes',
    openAnalyze: 'analyze',
    openMap: 'portal',
  };

  // Mobile collapse state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(() => !(window.innerWidth <= 768));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const h = expanded ? (isMobile ? 148 : 132) : (isMobile ? 92 : 88);
    document.documentElement.style.setProperty('--hud-h', `${h}px`);
  }, [expanded, isMobile]);

  const showMetrics = !isMobile || expanded;

  // Desktop hotkeys 1..6 (preserved from legacy HUD)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, [contenteditable="true"]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 6) {
        const slot = quickSlots[n - 1];
        if (slot) open(actionToView[slot.action]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div
      className="fixed left-3 right-3"
      style={{
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 'var(--z-hud)',
        pointerEvents: 'auto',
      }}
    >
      <div className="hud-panel hud-maple rounded-2xl px-4 py-3 select-none" aria-label="Game HUD">
        <span className="hud-spot" />
        <div className="flex flex-col gap-3">
        {/* Row 1: Identity + Actions */}
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          {/* Identity */}
          <div className="flex items-center gap-3 min-w-0 shrink">
            <EvolvingSphere size={44} level={stats.level} xpPct={stats.xp} mood="focused" />
            <div className="min-w-0">
              <div className="text-[13px] opacity-90 truncate">
                Lv. {stats.level} • Streak {stats.streak} • Mind Wizard
              </div>
              <div className="text-[15px] font-semibold truncate">Dean</div>
            </div>
          </div>

          {/* Actions (scroll on small, wrap/justify on desktop) */}
          <ul className="hud-actions flex gap-2 ml-auto overflow-x-auto flex-nowrap scroll-smooth snap-x snap-mandatory md:overflow-visible md:flex-wrap md:justify-end md:ml-auto">
            {quickSlots.map((a) => {
              const viewId = actionToView[a.action];
              return (
                <li key={a.id} className="snap-start">
                  <Link
                    to={(viewId && views.find((v) => v.id === viewId)?.path) || '/app'}
                    className="action-chip"
                    aria-label={a.label}
                    title={a.label}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!viewId) return;
                      const path = views.find((v) => v.id === viewId)?.path;
                      if (path) navigate(path);
                    }}
                  >
                    {a.icon ? (
                      <i className={cn("hud-glyph", a.icon)} />
                    ) : (
                      <span className="text-sm font-medium">{a.key}</span>
                    )}
                    <span className="hidden sm:inline text-sm">{a.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="snap-start">
              <Link
                to={views.find((v) => v.id === 'agent')?.path || '/app/agent'}
                className="action-chip mic"
                aria-label="Open Aurora Agent"
                title="Aurora Agent"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Agent</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Row 2: Gauges full width (hidden when collapsed on mobile) */}
        {showMetrics && (
          <div className="flex md:flex-row flex-col gap-2 md:items-center animate-fade-in">
            <div className="maple-gauge">
              <div className="maple-gauge__top">
                <span className="maple-gauge__label">HP</span>
                <span className="maple-gauge__val">{Math.floor(stats.hp)}%</span>
              </div>
              <div className="maple-gauge__bar hp"><span style={{ width: `${stats.hp}%` }} /></div>
            </div>
            <div className="maple-gauge">
              <div className="maple-gauge__top">
                <span className="maple-gauge__label">MP</span>
                <span className="maple-gauge__val">{Math.floor(stats.mp)}%</span>
              </div>
              <div className="maple-gauge__bar mp"><span style={{ width: `${stats.mp}%` }} /></div>
            </div>
            <div className="maple-gauge">
              <div className="maple-gauge__top">
                <span className="maple-gauge__label">XP</span>
                <span className="maple-gauge__val">{Math.floor(stats.xp)}%</span>
              </div>
              <div className="maple-gauge__bar xp"><span style={{ width: `${stats.xp}%` }} /></div>
            </div>
          </div>
        )}
        </div>

        {/* Mobile expand/collapse toggle */}
        {isMobile && (
          <button
            type="button"
            aria-label={expanded ? "Collapse HUD" : "Expand HUD"}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="absolute right-2 bottom-2 md:hidden rounded-full bg-background/60 border px-2 py-1 text-xs hover-scale"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
