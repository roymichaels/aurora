import { PropsWithChildren, useEffect, useMemo, useState } from "react";

function getMoodClass(): string {
  try {
    const m = localStorage.getItem("mood.last");
    if (!m) return "focused";
    return m.toLowerCase();
  } catch {
    return "focused";
  }
}

export default function HubScene({ children }: PropsWithChildren) {
  const [mood, setMood] = useState<string>(getMoodClass());

  const [timeClass, setTimeClass] = useState<string>(() => {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return "world-day";
    if (h >= 12 && h < 19) return "world-dusk";
    return "world-night";
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mood.last") {
        setMood(getMoodClass());
      }
    };
    const updateTime = () => {
      const h = new Date().getHours();
      setTimeClass(h >= 6 && h < 12 ? "world-day" : h < 19 ? "world-dusk" : "world-night");
    };
    window.addEventListener("storage", onStorage);
    const tmood = setInterval(() => setMood(getMoodClass()), 1200);
    const tclock = setInterval(updateTime, 60000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(tmood); clearInterval(tclock); };
  }, []);

  const moodClass = useMemo(() => {
    // map unknown moods to focused
    const known = ["calm","confident","focused","tired","stressed"];
    return known.includes(mood) ? mood : "focused";
  }, [mood]);

  return (
    <div className={`relative w-full h-full hub-scene ${moodClass} ${timeClass}`}>
      {/* Background layers */}
      <div className="absolute inset-0 world-sky" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-1/2 world-hills" aria-hidden />
      <div className="absolute inset-0 world-particles pointer-events-none" aria-hidden />

      {/* Content overlay */}
      <div className="relative z-[var(--z-content)] w-full h-full" style={{ paddingTop: 'var(--hud-h)' }}>{children}</div>
    </div>
  );
}
