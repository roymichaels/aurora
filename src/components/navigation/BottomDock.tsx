import { NavLink } from "react-router-dom";
import { Brain, BookOpen, Home, MoreHorizontal, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <nav
      className="fixed left-0 right-0"
      style={{
        bottom: `calc(var(--hud-h) + env(safe-area-inset-bottom))`,
        zIndex: "var(--z-hud)",
        height: "var(--dock-h)",
      }}
    >
      <ul className="mx-3 h-full flex justify-around items-center glass-panel rounded-2xl p-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center text-xs gap-1", isActive ? "text-primary" : "text-muted-foreground"
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
  );
}
