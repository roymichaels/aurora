import { Button } from "@/components/ui/button";

export default function ActionButton({ label = "Action", onPress }: { label?: string; onPress: () => void }) {
  return (
    <div className="fixed right-4 controls-safe" style={{ bottom: `calc(var(--safe-area-bottom) + var(--space-lg))` }}>
      <Button
        type="button"
        aria-label={label}
        onClick={onPress}
        className="h-16 w-16 rounded-2xl glass-panel elev grid place-items-center text-sm font-medium border border-border hover-scale"
      >
        {label}
      </Button>
    </div>
  );
}
