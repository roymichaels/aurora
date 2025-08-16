import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SoundControl } from "@/components/sounds/SoundControl";
import { AuthMenu } from "@/components/auth/AuthMenu";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function AppHeader() {
  const { user, initializing } = useSupabaseAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(true);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="fixed top-0 inset-x-0 z-30 pt-safe-top">
      <div className="px-4 sm:px-6">
        <div className="mt-3 glass-panel rounded-full px-3 py-2 elev flex items-center justify-between gap-3 animate-fade-in smooth">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <button
              className="text-sm font-semibold tracking-wide hover-scale"
              onClick={() => navigate("/")}
              aria-label="Go to Home"
            >
              MOS
            </button>
            <span className="hidden sm:inline text-xs text-muted-foreground">Mind Operating System</span>
          </div>

          {/* Right controls */}
          <nav className="flex items-center gap-2">
            {!online && <span className="text-xs text-muted-foreground">Offline</span>}
            <Button asChild variant="ghost" size="sm">
              <Link to="/stack" aria-label="View Tech Stack">Stack</Link>
            </Button>
            <SoundControl buttonSize="icon" buttonVariant="ghost" />
            <AuthMenu />
          </nav>
        </div>
      </div>
      {/* SEO: single H1 for the app */}
      <h1 className="sr-only">Mind Operating System – Focus, Roadmaps, and Progress</h1>
    </header>
  );
}
