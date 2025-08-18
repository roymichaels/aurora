import { useQuickActions } from "./quickActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionBarProps {
  compact?: boolean;
}

export function QuickActionBar({ compact = false }: QuickActionBarProps) {
  const actions = useQuickActions();
  if (!actions.length) return null;
  return (
    <ul className="flex items-center gap-3">
      {actions.map(({ id, label, icon: Icon, onClick }) => (
        <li key={id}>
          <div className="qx-item">
            <Button
              type="button"
              onClick={onClick}
              className={cn(
                "flex px-2 py-1 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2",
                compact
                  ? "items-center justify-center"
                  : "flex-col items-center gap-1"
              )}
              aria-label={label}
              title={label}
            >
              <Icon className="w-5 h-5" />
              {!compact && <span className="text-xs">{label}</span>}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
