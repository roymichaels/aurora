import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { quickSlots } from "@/game/hud/hud.data";
import { LipSyncAvatar } from "@/components/avatar/LipSyncAvatar";
import { Mic, ChevronDown, ChevronUp } from "lucide-react";
import { useHUDActions } from "@/game/hud/useHUDActions";
import { useAvatarStore } from "@/state/avatar";

function fire(type: string, payload?: any) {
  window.dispatchEvent(new CustomEvent('mos', { detail: { type, payload } }));
}

export function GameHUD() {
  const stats = useGameStore((s) => s.stats);
  const { run } = useHUDActions();
  const avatarEnabled = useAvatarStore((s) => s.enabled);

  // Mobile collapse state
  const isMobile = window.innerWidth <= 768;
  const [expanded, setExpanded] = useState(() => !isMobile);

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
        if (slot) run(slot.action);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
            {avatarEnabled && (
              <LipSyncAvatar size={44} />
            )}
            <div className="min-w-0">
              <div className="text-[13px] opacity-90 truncate">
                Lv. {stats.level} • Streak {stats.streak}
              </div>
              <div className="text-[15px] font-semibold truncate">Dean</div>
            </div>
          </div>

          {/* Actions (scroll on small, wrap/justify on desktop) */}
          <ul className="hud-actions flex gap-2 ml-auto overflow-x-auto flex-nowrap scroll-smooth snap-x snap-mandatory md:overflow-visible md:flex-wrap md:justify-end md:ml-auto">
            {quickSlots.map((a) => (
              <li key={a.id} className="snap-start">
                <button
                  type="button"
                  className="action-chip"
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => run(a.action)}
                >
                  {a.icon ? (
                    <i className={cn('hud-glyph', a.icon)} />
                  ) : (
                    <span className="text-sm font-medium">{a.key}</span>
                  )}
                  <span className="hidden sm:inline text-sm">{a.label}</span>
                </button>
              </li>
            ))}
            <li className="snap-start">
              <button
                type="button"
                className="action-chip mic"
                aria-label="Open Aurora Agent"
                title="Aurora Agent"
                onClick={() => fire('openAgent')}
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Agent</span>
              </button>
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
