import { QuickAction, useQuickActions } from "./quickActions";

export function QuickActionBar() {
  const actions = useQuickActions();
  if (!actions.length) return null;
  return (
    <div className="flex items-center gap-2">
      {actions.map(({ id, label, icon: Icon, onClick }: QuickAction) => (
        <button
          key={id}
          onClick={onClick}
          className="p-2 rounded-md hover:bg-accent"
          aria-label={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
