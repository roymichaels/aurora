import { NavLink } from "react-router-dom";
import { Brain, BookOpen, Home, MoreHorizontal, Radio } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { useAvatarStore } from "@/state/avatar";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { QuickActionBar } from "./QuickActionBar";

interface DockItem {
  to: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const items: DockItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/plan", label: "Brain", icon: Brain },
  { to: "/app/notes", label: "Journal", icon: BookOpen },
  { to: "/app/control", label: "Live", icon: Radio },
  { to: "/app/settings", label: "More", icon: MoreHorizontal },
];

export default function BottomDock() {
  const stats = useGameStore((s) => s.stats);
  const avatarEnabled = useAvatarStore((s) => s.enabled);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setHeight = () => {
      document.documentElement.style.setProperty(
        "--dock-h",
        `${el.offsetHeight}px`
      );
    };

    const observer = new ResizeObserver(setHeight);
    setHeight();
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="w-full pointer-events-auto">
      <div className="mx-3 hud-panel hud-maple rounded-2xl px-4 py-3 flex flex-col gap-2 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {avatarEnabled && <AuroraSphere size={44} />}
          <div className="min-w-0">
            <div className="text-[13px] opacity-90 truncate">
              Lv. {stats.level} • Streak {stats.streak}
            </div>
            <div className="text-[15px] font-semibold truncate">Dean</div>
          </div>
        </div>
        <div className="flex md:flex-row flex-col gap-2 md:items-center">
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
        <div
          role="region"
          aria-label="Quick actions"
          className="flex justify-around items-center"
        >
          <QuickActionBar />
        </div>
        <nav aria-label="Main navigation">
          <ul className="flex justify-around items-center">
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
    </div>
  );
}
