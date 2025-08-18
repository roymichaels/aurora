import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Brain,
  BookOpen,
  Radio,
  Settings,
  ListTodo,
  Target,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { useAvatarStore } from "@/state/avatar";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "live", label: "Live", icon: Radio },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "goals", label: "Goals", icon: Target },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomDock() {
  const stats = useGameStore((s) => s.stats);
  const avatarEnabled = useAvatarStore((s) => s.enabled);
  const ref = useRef<HTMLDivElement>(null);
  useKeyboardOffset();

  const [expanded, setExpanded] = useState(true);

  // measure height -> --dock-h
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => {
      const h = el.offsetHeight || 0;
      document.documentElement.style.setProperty("--dock-h", `${h}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const items = useMemo(
    () => [
      { to: "/app", label: "Home", icon: Home },
      { to: "/app/brain", label: "Brain", icon: Brain },
      { to: "/app/journal", label: "Journal", icon: BookOpen },
      { to: "/app/live", label: "Live", icon: Radio },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
    []
  );

  const toggle = () => setExpanded((e) => !e);

  return (
    <div
      ref={ref}
      className={cn(
        "fixed left-0 right-0 mx-3 select-none",
        "transition-[transform,opacity] duration-200",
        expanded ? "pb-3" : "pb-2"
      )}
      style={{
        bottom: `calc(var(--kb-offset) + var(--safe-area-bottom) + var(--chatbar-h) + var(--hud-gap))`,
        zIndex: 80,
        pointerEvents: "auto",
      }}
    >
      <div className="relative">
        <Button
          type="button"
          aria-label={expanded ? "Collapse dock" : "Expand dock"}
          onClick={toggle}
          className="absolute -top-2 left-0 right-0 h-3 rounded-t-2xl opacity-30 hover:opacity-60 focus:opacity-80 outline-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
        />

        <div
          className={cn(
            "glass-maple rounded-2xl px-4",
            expanded ? "py-3" : "py-2",
            "backdrop-blur-md"
          )}
        >
          {expanded && (
            <>
              <div className="flex items-center gap-3 min-w-0 mb-2">
                {avatarEnabled && (
                  <div
                    style={{
                      filter: 'drop-shadow(0 12px 28px rgba(0,0,0,.45))',
                    }}
                  >
                    <AuroraSphere size={52} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[13px] opacity-90 truncate">
                    Lv. {stats.level} • Streak {stats.streak}
                  </div>
                  <div className="text-[15px] font-semibold truncate">Dean</div>
                </div>
              </div>

              <div className="flex md:flex-row flex-col gap-2 md:items-center mb-1">
                <div className="maple-gauge">
                  <div className="maple-gauge__top">
                    <span className="maple-gauge__label">HP</span>
                    <span className="maple-gauge__val">
                      {Math.floor(stats.hp)}%
                    </span>
                  </div>
                  <div className="maple-gauge__bar hp">
                    <span style={{ width: `${stats.hp}%` }} />
                  </div>
                </div>
                <div className="maple-gauge">
                  <div className="maple-gauge__top">
                    <span className="maple-gauge__label">MP</span>
                    <span className="maple-gauge__val">
                      {Math.floor(stats.mp)}%
                    </span>
                  </div>
                  <div className="maple-gauge__bar mp">
                    <span style={{ width: `${stats.mp}%` }} />
                  </div>
                </div>
                <div className="maple-gauge">
                  <div className="maple-gauge__top">
                    <span className="maple-gauge__label">XP</span>
                    <span className="maple-gauge__val">
                      {Math.floor(stats.xp)}%
                    </span>
                  </div>
                  <div className="maple-gauge__bar xp">
                    <span style={{ width: `${stats.xp}%` }} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3">
            <ul className="flex items-center gap-3">
              {ACTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <Button
                    type="button"
                    className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2"
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="w-5 h-5" />
                    {expanded && <span className="text-xs">{label}</span>}
                  </Button>
                </li>
              ))}
              <li>
                <Button
                  type="button"
                  className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2"
                  aria-label="More"
                  title="More"
                >
                  <MoreHorizontal className="w-5 h-5" />
                  {expanded && <span className="text-xs">More</span>}
                </Button>
              </li>
            </ul>

            <nav aria-label="Main navigation">
              <ul className="flex gap-5">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={label}>
                    <NavLink
                      to={to}
                      end={to === "/app"}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col items-center text-xs gap-1",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )
                      }
                    >
                      <Icon className="w-5 h-5" />
                      {expanded ? (
                        <span>{label}</span>
                      ) : (
                        <span className="sr-only">{label}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
