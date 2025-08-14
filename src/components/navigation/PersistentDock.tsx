import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, Brain, NotebookText, Radio, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/brain", label: "Brain", icon: Brain },
  { to: "/app/notes", label: "Journal", icon: NotebookText },
  { to: "/app/live", label: "Live", icon: Radio },
  { to: "/app/settings", label: "More", icon: MoreHorizontal },
];

export function PersistentDock() {
  useEffect(() => {
    document.documentElement.style.setProperty("--dock-h", "56px");
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[var(--z-hud)] border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Primary"
    >
      <ul className="flex justify-around py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 text-xs text-muted-foreground hover:text-foreground",
                  isActive && "text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

