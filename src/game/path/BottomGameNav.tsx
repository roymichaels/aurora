const tabs = [
  { key: "home", label: "Home" },
  { key: "map", label: "Roadmap" },
  { key: "live", label: "Session" },
  { key: "rank", label: "Trophy" },
  { key: "aurora", label: "Aurora" },
];

export default function BottomGameNav({ onSelect }: { onSelect?: (key: 'home' | 'map' | 'live' | 'rank' | 'aurora') => void }) {
  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-20 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.5)]"
      style={{ bottom: `calc(var(--safe-area-bottom) + var(--space-sm))` }}
      role="tablist"
      aria-label="Game navigation"
    >
      <ul className="grid grid-cols-5 gap-2 p-2">
        {tabs.map((t) => (
          <li key={t.key} className="w-14 h-12 grid place-items-center">
            <button
              type="button"
              className="w-12 h-10 grid place-items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={t.label}
              onClick={() => onSelect?.(t.key as any)}
              role="tab"
            >
              <span className={`css-icon-${t.key}`} />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
