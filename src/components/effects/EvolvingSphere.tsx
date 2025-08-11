import React, { useMemo } from "react";

type Props = {
  size?: number;        // px
  level?: number;       // integer: affects satellites + pulse speed
  xpPct?: number;       // 0-100: affects hue
  mood?: "calm" | "focused" | "confident" | "stressed";
  className?: string;
  speaking?: boolean;   // voice activity
};

export function EvolvingSphere({
  size = 56,
  level = 1,
  xpPct = 0,
  mood = "calm",
  className = "",
  speaking = false,
}: Props) {
  // Map XP => hue; mood tints saturation/lightness
  const { hue, sat, light } = useMemo(() => {
    const baseHue = 180 + Math.round((xpPct / 100) * 140); // 180..320
    const palettes: Record<string, { s: number; l: number }> = {
      calm: { s: 65, l: 58 },
      focused: { s: 72, l: 55 },
      confident: { s: 80, l: 52 },
      stressed: { s: 85, l: 46 },
    };
    const p = palettes[mood] ?? palettes.calm;
    return { hue: baseHue, sat: p.s, light: p.l };
  }, [xpPct, mood]);

  // Evolution: more satellites as level increases
  const satellites = Math.min(6, Math.max(1, Math.floor(level / 3) + 1));
  const speed = Math.max(6, 12 - Math.floor(level / 5)); // faster as you level

  const intensity = speaking ? 1 : 0.3;

  const vars: React.CSSProperties = {
    // expose to CSS
    ["--es-size" as any]: `${size}px`,
    ["--es-hue" as any]: hue,
    ["--es-sat" as any]: `${sat}%`,
    ["--es-light" as any]: `${light}%`,
    ["--es-speed" as any]: `${speed}s`,
    ["--es-intensity" as any]: intensity,
  };

  return (
    <div className={`es-wrap ${className}`} style={vars}>
      {/* inline SVG filter for goo effect */}
      <svg className="es-svg" width="0" height="0">
        <defs>
          <filter id="es-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -10"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className="es-sphere">
        {/* core */}
        <div className="es-core" />
        {/* satellites */}
        {Array.from({ length: satellites }).map((_, i) => (
          <div key={i} className="es-sat" style={{ ["--i" as any]: i }} />
        ))}
        {/* highlight */}
        <div className="es-spec" />
      </div>
    </div>
  );
}
