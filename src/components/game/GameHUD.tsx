import React, { useEffect, useState } from "react";
import { useGameStore } from "@/game/store";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAvatarStore } from "@/state/avatar";
import HUDQuickActions from "@/components/hud/HUDQuickActions";
import ModalHost from "@/components/modals/ModalHost";
import SettingsPanel from "../../../frontend/components/SettingsPanel.jsx";

export function GameHUD() {
  const stats = useGameStore((s) => s.stats);
  const avatarEnabled = useAvatarStore((s) => s.enabled);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mobile collapse state
  const isMobile = window.innerWidth <= 768;
  const [expanded, setExpanded] = useState(() => !isMobile);

  useEffect(() => {
    const h = expanded ? (isMobile ? 148 : 132) : (isMobile ? 92 : 88);
    document.documentElement.style.setProperty('--hud-h', `${h}px`);
  }, [expanded, isMobile]);

  const showMetrics = !isMobile || expanded;

  return (
    <>
      <ModalHost />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div
        className="fixed left-3 right-3"
        style={{
          top: 'max(var(--space-md), var(--safe-area-top))',
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
            {avatarEnabled && <AuroraSphere size={44} />}
            <div className="min-w-0">
              <div className="text-[13px] opacity-90 truncate">
                Lv. {stats.level} • Streak {stats.streak}
              </div>
              <div className="text-[15px] font-semibold truncate">Dean</div>
            </div>
          </div>

        {/* Actions (scroll on small, wrap/justify on desktop) */}
          <HUDQuickActions />
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
    </>
  );
}
