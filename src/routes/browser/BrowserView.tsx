import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmbedPane } from "./EmbedPane";

export default function BrowserView() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [current, setCurrent] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // initialize from query param or last-used value
  useEffect(() => {
    const params = new URLSearchParams(search);
    const initial = params.get("url") || localStorage.getItem("lastBrowserUrl") || "";
    setUrl(initial);
    setCurrent(initial);
    if (initial) localStorage.setItem("lastBrowserUrl", initial);
  }, [search]);

  const go = (next: string) => {
    try {
      const trimmed = next.trim();
      if (!trimmed) return;
      const withProto = /^(https?:)?\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      setUrl(withProto);
      setCurrent(withProto);
      localStorage.setItem("lastBrowserUrl", withProto);
      navigate(`/app/browser?url=${encodeURIComponent(withProto)}`, { replace: true });
    } catch {
      // ignore malformed URLs
    }
  };

  const presets = useMemo(() => [
    { label: "Notion", href: "https://www.notion.so/" },
    { label: "Google Docs", href: "https://docs.google.com/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
  ], []);

  return (
    <div className="flex flex-col min-h-full">
      <header className="glass-panel elev rounded-b-xl px-3 md:px-4 py-2 sticky top-0 z-30">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-sm md:text-base font-semibold">Aurora OS</div>
          <form
            className="flex-1 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              go(url);
            }}
          >
            <Input
              ref={inputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a site (e.g., notion.so)"
              className="h-9"
              aria-label="Site URL"
            />
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (window.location.href = "/extension")}
          >
            Extension
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.href}
              size="sm"
              variant="secondary"
              onClick={() => {
                setUrl(p.href);
                go(p.href);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <EmbedPane url={current} />
      </div>
    </div>
  );
}

