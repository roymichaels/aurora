import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AvatarIdle from "./AvatarIdle";
import XPTotem from "./XPTotem";
import VirtualJoystick from "./VirtualJoystick";
import ActionButton from "./ActionButton";
import WorldOverlayRouter, { OverlayId } from "./WorldOverlayRouter";

const WORLD_WIDTH = 2400;
const GROUND_Y = 0; // relative ground for jump calc

type Zone = { id: OverlayId; x: number; label: string };

export default function SideScrollWorld() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  const zones: Zone[] = useMemo(
    () => [
      { id: "garden", x: 350, label: "Garden" },
      { id: "library", x: 650, label: "Library" },
      { id: "mentor", x: 1180, label: "Mentor" },
      { id: "focus", x: 1800, label: "Hall of Focus" },
    ],
    []
  );

  const [playerX, setPlayerX] = useState<number>(() => {
    try { return Number(localStorage.getItem("world.x")) || 1200; } catch { return 1200; }
  });
  const [playerY, setPlayerY] = useState<number>(0);
  const [velY, setVelY] = useState<number>(0);
  const [vec, setVec] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [overlay, setOverlay] = useState<OverlayId | null>(null);

  const speed = 220; // px/sec
  const gravity = 900; // px/sec^2
  const jumpVel = -420; // px/sec

  // Resize
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keyboard support (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlay) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) setVec((v) => ({ ...v, x: -1 }));
      if (["ArrowRight", "KeyD"].includes(e.code)) setVec((v) => ({ ...v, x: 1 }));
      if (["ArrowUp", "Space", "KeyW"].includes(e.code)) jump();
    };
    const onUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(e.code)) setVec((v) => ({ ...v, x: 0 }));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, [overlay]);

  // Physics loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.032, (t - last) / 1000);
      last = t;
      if (!overlay) {
        // Horizontal
        const nextX = Math.max(0, Math.min(WORLD_WIDTH, playerX + vec.x * speed * dt));
        if (nextX !== playerX) setPlayerX(nextX);
        // Vertical (jump)
        let vy = velY + gravity * dt;
        let ny = playerY + vy * dt;
        if (ny >= GROUND_Y) { ny = GROUND_Y; vy = 0; }
        setVelY(vy);
        setPlayerY(ny);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playerX, vec.x, playerY, velY, overlay]);

  // Persist X
  useEffect(() => {
    try { localStorage.setItem("world.x", String(Math.round(playerX))); } catch {}
  }, [playerX]);

  const jump = useCallback(() => {
    if (overlay) return;
    if (playerY === GROUND_Y) {
      setVelY(jumpVel);
    }
  }, [overlay, playerY]);

  const nearestZone = useMemo(() => {
    let best: Zone | null = null; let bestDist = Infinity;
    for (const z of zones) {
      const d = Math.abs(z.x - playerX);
      if (d < bestDist) { best = z; bestDist = d; }
    }
    return { z: best, dist: bestDist };
  }, [zones, playerX]);

  const canEnter = nearestZone.z && nearestZone.dist < 80;

  const doAction = () => {
    if (canEnter && nearestZone.z) setOverlay(nearestZone.z.id);
    else jump();
  };

  // Camera
  const cameraX = Math.max(0, Math.min(WORLD_WIDTH - vw, playerX - vw / 2));

  return (
    <div ref={viewportRef} className="world-viewport">
      {/* Parallax foreground */}
      <div className="parallax-foreground" aria-hidden />

      {/* World canvas */}
      <div className="world-canvas">
        <div
          className="world-track"
          style={{ width: WORLD_WIDTH, transform: `translateX(${-cameraX}px)` }}
        >
          {/* Ground */}
          <div className="world-ground" />

          {/* Buildings and zones */}
          {/* Garden */}
          <div className="building" style={{ left: 260 }} aria-label="Mood Garden">
            <div className="label">Garden</div>
            <div className={`door ${canEnter && nearestZone.z?.id === "garden" ? "glow" : ""}`} />
          </div>
          {/* Library */}
          <div className="building" style={{ left: 560 }} aria-label="Library of Wins">
            <div className="label">Library</div>
            <div className={`door ${canEnter && nearestZone.z?.id === "library" ? "glow" : ""}`} />
          </div>

          {/* Town square elements */}
          <div className="npc grid place-items-center" style={{ left: 1140 }} aria-label="Mentor">
            <span className="text-xs">🧙</span>
          </div>
          <div className="building" style={{ left: 1100, width: 200, height: 1 }} aria-hidden />
          <div style={{ position: "absolute", left: 1120, bottom: "calc(12% + 12px)", width: 240 }}>
            <XPTotem />
          </div>

          {/* Hall of Focus */}
          <div className="building" style={{ left: 1710 }} aria-label="Hall of Focus">
            <div className="label">Hall of Focus</div>
            <div className={`door ${canEnter && nearestZone.z?.id === "focus" ? "glow" : ""}`} />
          </div>

          {/* Enter hint */}
          {canEnter && nearestZone.z && (
            <div className="hint" style={{ left: nearestZone.z.x }}>
              Press Action to enter {nearestZone.z.label}
            </div>
          )}

          {/* Player */}
          <div className="player" style={{ left: playerX - 40, transform: `translateY(${playerY}px)` }}>
            <AvatarIdle size={80} />
          </div>
        </div>
      </div>

      {/* Controls */}
      {!overlay && (
        <>
          <VirtualJoystick onChange={(v) => setVec({ x: Math.max(-1, Math.min(1, v.x)), y: v.y })} onEnd={() => setVec({ x: 0, y: 0 })} />
          <ActionButton label={canEnter ? "Enter" : "Jump"} onPress={doAction} />
        </>
      )}

      {/* Overlay router */}
      <WorldOverlayRouter id={overlay} onClose={() => setOverlay(null)} />
    </div>
  );
}
