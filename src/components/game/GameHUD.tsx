import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { quickSlots } from "@/game/hud/hud.data";
import { AvatarSphere } from "@/components/avatar/AvatarSphere";
import { Mic, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useTextToSpeech } from "@/voice/useTextToSpeech";
import { useHUDActions } from "@/game/hud/useHUDActions";
import { useAvatarStore } from "@/state/avatar";
import SettingsPanel from "../../../frontend/components/SettingsPanel.jsx";
import { bus } from "@/utils/bus";

function fire<T>(type: string, payload?: T) {
  window.dispatchEvent(new CustomEvent('mos', { detail: { type, payload } }));
}

export function GameHUD() {
  const stats = useGameStore((s) => s.stats);
  const { run } = useHUDActions();
  const avatarEnabled = useAvatarStore((s) => s.enabled);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { enabled, enable } = useTextToSpeech();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Mobile collapse state
  const isMobile = window.innerWidth <= 768;
  const [expanded, setExpanded] = useState(() => !isMobile);

  useEffect(() => {
    const h = expanded ? (isMobile ? 148 : 132) : (isMobile ? 92 : 88);
    document.documentElement.style.setProperty('--hud-h', `${h}px`);
  }, [expanded, isMobile]);

  useEffect(() => {
    const onListen = (e: Event) => setListening(Boolean((e as CustomEvent).detail));
    window.addEventListener('voice-listening', onListen);
    const off = bus.on('voice/state:set', ({ state }) => setProcessing(state === 'thinking'));
    return () => {
      window.removeEventListener('voice-listening', onListen);
      off();
    };
  }, []);

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
  }, [run]);

  return (
    <>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div
        className="fixed left-3 right-3"
        style={{
          top: 'max(12px, env(safe-area-inset-top))',
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
            {avatarEnabled && <AvatarSphere size={44} draggable={false} />}
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
            {!enabled && (
              <li className="snap-start">
                <button
                  type="button"
                  className="action-chip"
                  aria-label="Enable voice"
                  title="Enable voice"
                  onClick={enable}
                >
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Enable Voice</span>
                </button>
              </li>
            )}
            {listening && (
              <li className="snap-start">
                <div className="action-chip pointer-events-none">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span className="hidden sm:inline text-sm">Listening</span>
                </div>
              </li>
            )}
            {processing && (
              <li className="snap-start">
                <div className="action-chip pointer-events-none">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline text-sm">Processing</span>
                </div>
              </li>
            )}
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
            <li className="snap-start">
              <button
                type="button"
                className="action-chip"
                aria-label="Open Settings"
                title="Settings"
                onClick={() => setSettingsOpen(true)}
              >
                <span className="text-sm font-medium">Settings</span>
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
    </>
  );
}
