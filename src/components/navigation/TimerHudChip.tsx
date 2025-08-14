import { useFocusTimer, formatTime } from '@/state/focusTimer';
import { useViewNav } from '@/state/view';

export function TimerHudChip() {
  const { running, remaining } = useFocusTimer();
  const open = useViewNav();
  if (!running) return null;
  return (
    <button
      onClick={() => open('focus')}
      className="fixed top-2 right-2 z-[var(--z-hud)] bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs pointer-events-auto"
    >
      {formatTime(remaining)}
    </button>
  );
}
