import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Brain,
  BookOpen,
  Radio,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { useAvatarStore } from "@/state/avatar";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { Button } from "@/components/ui/button";

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
        bottom: `calc(var(--kb-offset) + var(--safe-area-bottom) + var(--chatbar-h) + var(--gap-h))`,
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
              <div className="flex items-center gap-2 min-w-0 mb-2">
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

              <div className="flex md:flex-row flex-col gap-1 md:items-center mb-2">
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
          <nav aria-label="Main navigation">
            <ul
              className={cn(
                "flex justify-center",
                expanded ? "gap-4" : "gap-3",
              )}
            >
              {items.map(({ to, label, icon: Icon }) => (
                <li key={label}>
                  <NavLink
                    to={to}
                    end={to === "/app"}
                    aria-label={label}
                    className={({ isActive }) =>
                      cn(
                        "flex text-xs",
                        expanded
                          ? "flex-col items-center gap-1"
                          : "items-center justify-center",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {expanded && <span>{label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
