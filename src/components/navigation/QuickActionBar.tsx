import { useQuickActions } from "./quickActions";

export function QuickActionBar({ iconsOnly = false }: { iconsOnly?: boolean }) {
  const actions = useQuickActions();
  if (!actions.length) return null;
  return (
    <ul className="flex items-center gap-3">
      {actions.map(({ id, label, icon: Icon, onClick }) => (
        <li key={id}>
          <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2"
            aria-label={label}
            title={label}
          >
            <Icon className="w-5 h-5" />
            {!iconsOnly && <span className="text-xs">{label}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
