import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Home, Brain, BookOpen, Radio, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { useAvatarStore } from "@/state/avatar";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { QuickActionBar } from "./QuickActionBar";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { Button } from "@/components/ui/button";

const DOCK_COLLAPSE_KEY = "ui:dock:collapsed";

export default function BottomDock() {
  const stats = useGameStore((s) => s.stats);
  const avatarEnabled = useAvatarStore((s) => s.enabled);
  const ref = useRef<HTMLDivElement>(null);
  useKeyboardOffset();

  // collapsed state persisted in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(DOCK_COLLAPSE_KEY) === "1";
  });
  useEffect(() => {
    localStorage.setItem(DOCK_COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

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

  const onEdgeClick = () => setCollapsed((c) => !c);

  return (
    <div
      ref={ref}
      className={cn(
        "fixed left-0 right-0 mx-3 select-none",
        "transition-[transform,opacity] duration-200",
        collapsed ? "pb-2" : "pb-3"
      )}
      style={{
        bottom: `calc(var(--kb-offset) + var(--safe-area-bottom) + var(--chatbar-h) + var(--hud-gap))`,
        zIndex: 80,
        pointerEvents: "auto",
      }}
    >
      <Button
        type="button"
        aria-label={collapsed ? "Expand dock" : "Collapse dock"}
        onClick={onEdgeClick}
        className="absolute -top-2 left-0 right-0 h-3 rounded-t-2xl opacity-30 hover:opacity-60 focus:opacity-80 outline-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      />

      <div
        className={cn(
          "hud-panel hud-maple rounded-2xl px-4",
          collapsed ? "py-2" : "py-3",
          "backdrop-blur-md"
        )}
      >
        {collapsed ? (
          <div className="flex items-center justify-between gap-3">
            <QuickActionBar iconsOnly />
            <nav aria-label="Main navigation">
              <ul className="flex gap-5">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={label}>
                    <NavLink
                      to={to}
                      end={to === "/app"}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col items-center text-[11px] gap-1",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span className="sr-only">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0 mb-2">
              {avatarEnabled && <AuroraSphere size={44} />}
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
                  <span className="maple-gauge__val">{Math.floor(stats.hp)}%</span>
                </div>
                <div className="maple-gauge__bar hp">
                  <span style={{ width: `${stats.hp}%` }} />
                </div>
              </div>
              <div className="maple-gauge">
                <div className="maple-gauge__top">
                  <span className="maple-gauge__label">MP</span>
                  <span className="maple-gauge__val">{Math.floor(stats.mp)}%</span>
                </div>
                <div className="maple-gauge__bar mp">
                  <span style={{ width: `${stats.mp}%` }} />
                </div>
              </div>
              <div className="maple-gauge">
                <div className="maple-gauge__top">
                  <span className="maple-gauge__label">XP</span>
                  <span className="maple-gauge__val">{Math.floor(stats.xp)}%</span>
                </div>
                <div className="maple-gauge__bar xp">
                  <span style={{ width: `${stats.xp}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <QuickActionBar />
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
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

