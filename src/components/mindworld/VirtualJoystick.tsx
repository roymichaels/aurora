import { useRef, useState, useEffect } from "react";

/**
 * VirtualJoystick
 * - Mobile-friendly thumbstick that emits a normalized vector [-1,1]
 * - Appears bottom-left, semi-transparent, only captures pointer inside its area
 */
export default function VirtualJoystick({
  onChange,
  onEnd,
  size = 120,
}: {
  onChange: (vec: { x: number; y: number }) => void;
  onEnd?: () => void;
  size?: number;
}) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const centerRef = useRef({ cx: 0, cy: 0, r: 0 });

  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    const el = baseRef.current;
    el?.addEventListener("touchmove", prevent, { passive: false });
    return () => el?.removeEventListener("touchmove", prevent);
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const start = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = rect.width / 2;
    centerRef.current = { cx, cy, r };
    const dx = clientX - cx;
    const dy = clientY - cy;
    const mag = Math.hypot(dx, dy);
    const clampedMag = Math.min(mag, r * 0.6);
    const nx = (dx / (r * 0.6)) * (clampedMag / (r * 0.6));
    const ny = (dy / (r * 0.6)) * (clampedMag / (r * 0.6));
    setActive(true);
    setThumb({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) });
    onChange({ x: clamp(dx / r, -1, 1), y: clamp(dy / r, -1, 1) });
  };

  const move = (clientX: number, clientY: number) => {
    if (!active) return;
    const { cx, cy, r } = centerRef.current;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const mag = Math.hypot(dx, dy);
    const clampedMag = Math.min(mag, r * 0.6);
    const nx = (dx / (r * 0.6)) * (clampedMag / (r * 0.6));
    const ny = (dy / (r * 0.6)) * (clampedMag / (r * 0.6));
    setThumb({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) });
    onChange({ x: clamp(dx / r, -1, 1), y: clamp(dy / r, -1, 1) });
  };

  const end = () => {
    setActive(false);
    setThumb({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
    onEnd?.();
  };

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
  };

  const thumbStyle: React.CSSProperties = {
    transform: `translate(${thumb.x * (size * 0.3)}px, ${thumb.y * (size * 0.3)}px)`,
  };

  return (
    <div
      className="fixed left-4" style={{ bottom: `calc(var(--safe-area-bottom) + var(--space-lg))` }}
    >
      <div
        ref={baseRef}
        className="rounded-full bg-secondary/60 border border-border/60 backdrop-blur-md shadow-inner shadow-black/30 touch-none select-none"
        style={baseStyle}
        onMouseDown={(e) => start(e.clientX, e.clientY)}
        onMouseMove={(e) => move(e.clientX, e.clientY)}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={(e) => {
          const t = e.touches[0];
          start(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          move(t.clientX, t.clientY);
        }}
        onTouchEnd={end}
      >
        <div className="relative w-full h-full grid place-items-center">
          <div className="absolute w-[70%] h-[70%] rounded-full border-2 border-border/70" />
          <div
            className="w-10 h-10 rounded-full bg-background/70 border border-border shadow-md"
            style={thumbStyle}
          />
        </div>
      </div>
    </div>
  );
}
