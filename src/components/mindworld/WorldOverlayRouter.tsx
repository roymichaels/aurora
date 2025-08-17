
import { PropsWithChildren } from "react";
import RoadmapsManager from "@/components/control/RoadmapsManager";
import ArchivePanel from "@/components/archive/ArchivePanel";
import { MoodCarousel } from "@/components/live/MoodCarousel";
import HypnosisLauncher from "@/components/hypnosis/HypnosisLauncher";
import AgentPanel from "@/components/agent/AgentPanel";
import { Button } from "@/components/ui/button";

export type OverlayId = "mentor" | "library" | "garden" | "focus" | "agent";

function OverlayShell({ title, children, onClose }: PropsWithChildren<{ title: string; onClose: () => void }>) {
  return (
    <div className="fixed inset-0" style={{ zIndex: 'var(--z-modal)' }} role="dialog">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 p-4 grid place-items-center">
        <section className="w-full max-w-4xl h-[80vh] glass-panel rounded-2xl elev overflow-hidden">
          <header className="px-4 py-3 flex items-center justify-between border-b border-border/60">
            <h1 className="text-lg font-semibold leading-none">{title}</h1>
            <Button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:opacity-80">Close</Button>
          </header>
          <main className="p-4 h-[calc(80vh-56px)] overflow-auto">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}

export default function WorldOverlayRouter({ id, onClose }: { id: OverlayId | null; onClose: () => void }) {
  if (!id) return null;
  if (id === "focus") {
    return (
      <OverlayShell title="Hall of Focus" onClose={onClose}>
        <RoadmapsManager />
      </OverlayShell>
    );
  }
  if (id === "library") {
    return (
      <OverlayShell title="Library of Wins" onClose={onClose}>
        <ArchivePanel />
      </OverlayShell>
    );
  }
  if (id === "garden") {
    return (
      <OverlayShell title="Mood Garden" onClose={onClose}>
        <div className="max-w-md mx-auto">
          <MoodCarousel />
        </div>
      </OverlayShell>
    );
  }
  if (id === "mentor") {
    return (
      <OverlayShell title="Mentor" onClose={onClose}>
        <div className="max-w-xl mx-auto grid gap-4">
          <HypnosisLauncher />
        </div>
      </OverlayShell>
    );
  }
  if (id === "agent") {
    return (
      <OverlayShell title="Aurora Agent" onClose={onClose}>
        <AgentPanel />
      </OverlayShell>
    );
  }
  return null;
}
