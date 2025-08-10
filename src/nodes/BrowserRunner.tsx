import { useEffect, useRef, useState } from "react";

type Props = { node: { id: string; label: string; url?: string }; onExit: () => void };

export default function BrowserRunner({ node, onExit }: Props) {
  const [url, setUrl] = useState(node.url ?? "https://www.notion.so/");
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) setBlocked(true);
      } catch {
        // cross-origin → likely fine; don't mark blocked here
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [url]);

  return (
    <main className="relative min-h-svh px-4 pt-6 pb-28">
      <div className="os-bg" />
      <div className="flex items-center gap-2 mb-3">
        <input
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL"
        />
        <button className="btn" onClick={() => setBlocked(false)}>Go</button>
        <button className="btn" onClick={onExit}>Back</button>
      </div>

      <div className="relative h-[70vh] rounded-lg overflow-hidden border border-white/10">
        <iframe
          ref={iframeRef}
          key={url}
          src={url}
          className="w-full h-full bg-black/40"
          onError={() => setBlocked(true)}
        />
        {blocked && (
          <div className="absolute inset-0 grid place-items-center text-center p-6 bg-black/50 backdrop-blur">
            <div>
              <p className="mb-3">This site blocks embedding in an iframe.</p>
              <div className="flex gap-3 justify-center">
                <a className="btn" href={url} target="_blank" rel="noreferrer">Open in New Tab</a>
                <a className="btn" href="/extension">Get Extension</a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 opacity-80 text-sm">
        <p>Quick recipes: Summarize page • Extract tasks • Write outline (coming soon)</p>
      </div>
    </main>
  );
}
