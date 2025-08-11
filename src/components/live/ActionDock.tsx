import { Button } from "@/components/ui/button";

export default function ActionDock({
  onStart,
  onNotes,
  onVoice,
}: {
  onStart: () => void;
  onNotes?: () => void;
  onVoice?: () => void;
}) {
  return (
    <div className="fixed inset-x-0" style={{ bottom: `calc(env(safe-area-inset-bottom) + 12px)` }}>
      <div className="mx-auto max-w-3xl px-4 pointer-events-none">
        <div className="pointer-events-auto glass-panel rounded-2xl p-2 elev flex flex-wrap gap-2 justify-center">
          <Button className="h-12 rounded-xl px-5" onClick={onStart}>Start Hypnosis Session</Button>
          <Button variant="soft" className="h-12 rounded-xl px-5" onClick={onNotes ?? (() => {})}>Voice Notes</Button>
          <Button variant="soft" className="h-12 rounded-xl px-5" onClick={onVoice ?? (() => {})}>Voice</Button>
        </div>
      </div>
    </div>
  );
}
