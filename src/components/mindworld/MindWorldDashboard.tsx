import { useState, useCallback, useEffect } from "react";
import HubScene from "./HubScene";

import GameCanvas from "@/game/GameCanvas";
import VirtualJoystick from "./VirtualJoystick";

import WorldOverlayRouter, { type OverlayId } from "./WorldOverlayRouter";
import { GameHUD } from "@/components/game/GameHUD";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGameStore } from "@/game/store";
import { REWARDS } from "@/game/QuestEngine";

export default function MindWorldDashboard() {
  const [vec, setVec] = useState({ x: 0, y: 0 });
  const [actionTick, setActionTick] = useState(0);
  const [overlay, setOverlay] = useState<OverlayId | null>(null);

  const handleEnter = useCallback((id: OverlayId) => setOverlay(id), []);

  const isMobile = useIsMobile();
  const [joyEnabled, setJoyEnabled] = useLocalStorage<boolean>("joystick.enabled", isMobile);

  // Game store actions
  const awardXP = useGameStore(s => s.awardXP);
  const completeQuest = useGameStore(s => s.completeQuest);

  // Toggle joystick via global event and persist
  useEffect(() => {
    const onMos = (e: any) => {
      if (e.detail?.type === 'toggleJoystick') {
        setJoyEnabled((v) => !v);
      }
    };
    window.addEventListener('mos', onMos as any);
    return () => window.removeEventListener('mos', onMos as any);
  }, [setJoyEnabled]);

  // Keyboard controls (desktop)
  useEffect(() => {
    const pressed = new Set<string>();
    const updateVec = () => {
      if (overlay) return; // pause input when overlay is open
      const x = (pressed.has('right') ? 1 : 0) + (pressed.has('left') ? -1 : 0);
      setVec((v) => ({ ...v, x }));
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { pressed.add('left'); updateVec(); }
      if (k === 'arrowright' || k === 'd') { pressed.add('right'); updateVec(); }
      if (k === ' ' || k === 'enter' || k === 'e') { setActionTick((t) => t + 1); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { pressed.delete('left'); updateVec(); }
      if (k === 'arrowright' || k === 'd') { pressed.delete('right'); updateVec(); }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [overlay]);

  // Listen to global HUD quick actions and open overlays accordingly + quests/XP
  useEffect(() => {
    const set = (id: OverlayId | null) => setOverlay(id);
    const onMos = (e: any) => {
      const t = e.detail?.type;
      if (t === 'startFocus') { set('focus'); completeQuest('pick-focus'); awardXP(REWARDS.completeQuest); }
      if (t === 'startHypnosis') { set('mentor'); completeQuest('start-hypno'); awardXP(REWARDS.completeQuest); }
      if (t === 'voiceNote') { set('library'); completeQuest('record-voice'); awardXP(REWARDS.completeQuest); }
      if (t === 'addNote') { set('library'); completeQuest('add-note'); awardXP(REWARDS.completeQuest); }
      if (t === 'openAnalyze') { set('analyze'); completeQuest('open-analyze'); awardXP(REWARDS.completeQuest); }
      if (t === 'openMap') { document.dispatchEvent(new CustomEvent('open-fast-travel')); }
    };
    window.addEventListener('mos', onMos as any);
    return () => window.removeEventListener('mos', onMos as any);
  }, [awardXP, completeQuest]);

  // Close overlay with Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlay) {
        e.preventDefault();
        setOverlay(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay]);

  return (
    <section className="w-full h-full">
      <HubScene>

        {/* CSS side-scrolling world */}
        <div className="absolute inset-0">
          <GameCanvas inputVec={vec} actionTick={actionTick} overlayId={overlay} onEnter={handleEnter} />
        </div>

        {/* Mobile controls */}
        {joyEnabled && <VirtualJoystick onChange={setVec} />}
        

        {/* HUD overlay */}
        <GameHUD />

        {/* World Overlays */}
        <WorldOverlayRouter id={overlay} onClose={() => setOverlay(null)} />
      </HubScene>
    </section>
  );
}
