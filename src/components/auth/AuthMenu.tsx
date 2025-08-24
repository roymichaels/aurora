
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTonAuth } from "@/hooks/useTonAuth";

export function AuthMenu() {
  const { address, disconnect } = useTonAuth();

  if (!address) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="primary" size="lg">
          <Link to="/auth">Get Started Free</Link>
        </Button>
      </div>
    );
  }

  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground max-w-[160px] truncate">{short}</span>
      <Button variant="softPrimary" size="sm" onClick={disconnect}>Disconnect</Button>
    </div>
  );
}
