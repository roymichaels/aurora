import {
  Brain,
  BookOpen,
  MoreHorizontal,
  Radio,
  Target,
  Sparkles,
  NotebookPen,
  Mic,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/game/store";
import { useAvatarStore } from "@/state/avatar";
import { type ModalId, useUIStore } from "@/state/ui";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";

interface Action {
  id: ModalId;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const actions: Action[] = [
  { id: "brain", label: "Brain", icon: Brain },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "live", label: "Live", icon: Radio },
  { id: "settings", label: "Settings", icon: MoreHorizontal },
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

  const { activeModal, openModal } = useUIStore();

  return (
    <div
      className="fixed inset-x-0 pointer-events-none"
      style={{
        bottom: `calc(var(--kb-offset) + var(--safe-area-bottom))`,
        zIndex: "var(--z-hud)",
      }}
    >
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
        <div className="flex items-center">
          <div
            role="region"
            aria-label="Quick actions"
            className="flex items-center gap-2"
          >
            <button
              onClick={() => useUIStore.getState().openModal("focus")}
              aria-label="Focus"
              className="p-2 rounded-md hover:bg-accent"
            >
              <Target className="w-5 h-5" />
            </button>
            <button
              onClick={() => useUIStore.getState().openModal("hypno")}
              aria-label="Hypno"
              className="p-2 rounded-md hover:bg-accent"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => useUIStore.getState().openModal("notes")}
              aria-label="Notes"
              className="p-2 rounded-md hover:bg-accent"
            >
              <NotebookPen className="w-5 h-5" />
            </button>
            <button
              onClick={() => useUIStore.getState().openModal("voice")}
              aria-label="Voice"
              className="p-2 rounded-md hover:bg-accent"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <nav aria-label="Main navigation" className="flex-1">
            <ul className="flex justify-around items-center">
              {actions.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => openModal(id)}
                    className={cn(
                      "flex flex-col items-center text-xs gap-1",
                      activeModal === id
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
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
