import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { tracks } from "@/data/roadmap";
import { NodeCard } from "@/components/roadmap/NodeCard";
import { TrackLegend } from "@/components/roadmap/TrackLegend";
import { useProgressStore } from "@/state/progress";

export default function RoadmapHome() {
  const navigate = useNavigate();
  const { completed, unlocked } = useProgressStore();

  // SEO
  useMemo(() => {
    document.title = "Aurora Mind OS – Roadmap";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Roadmap-first home: hypnosis, focus, browser, notes, rewards.");
  }, []);

  return (
    <main className="relative min-h-svh overflow-hidden">
      {/* vignette bg */}
      <div className="os-bg pointer-events-none bg-[radial-gradient(900px_400px_at_50%_-10%,hsl(var(--accent)/.12),transparent)]" />

      <section className="mx-auto max-w-[720px] px-4 pt-8 pb-28">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Your Roadmap</h1>
          <p className="opacity-80">Clear next steps. Tap a node to start.</p>
        </header>

        <TrackLegend />

        <ul className="mt-4 space-y-8">
          {tracks.map((track) => (
            <li key={track.id}>
              <h2 className="text-sm uppercase tracking-wide opacity-70 mb-3">{track.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {track.nodes.map((n, idx) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <NodeCard
                      node={n}
                      completed={!!completed[n.id]}
                      unlocked={unlocked.has(n.id) || !n.locked}
                      onClick={() => navigate(`/app/node/${n.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
