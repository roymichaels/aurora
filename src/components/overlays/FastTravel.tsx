import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const fire = (type: string, payload?: any) => {
  window.dispatchEvent(new CustomEvent('mos', { detail: { type, payload } }));
};

const ZONES = [
  { key: 'focus', label: 'Training Grounds', type: 'startFocus' },
  { key: 'hypno', label: 'Hypno Temple', event: 'open-hypno-panel' },
  { key: 'voice', label: 'Sound Studio', type: 'voiceNote' },
  { key: 'notes', label: 'Idea Forest', type: 'addNote' },
];

export default function FastTravel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('open-fast-travel', h as any);
    return () => window.removeEventListener('open-fast-travel', h as any);
  }, []);

  if (!open) return null;

  const onSelect = (z: { type?: string; event?: string }) => {
    setOpen(false);
    if (z.type) fire(z.type);
    else if (z.event) window.dispatchEvent(new CustomEvent(z.event));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="glass-panel rounded-t-2xl md:rounded-2xl w-full md:w-[640px] p-4 elev">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Portal Plaza</h3>
          <Button className="rounded-full px-3 py-1 bg-secondary" type="button" onClick={()=>setOpen(false)}>Close</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {ZONES.map(z => (
            <Button key={z.key}
              type="button"
              onClick={() => onSelect(z)}
              className="rounded-xl p-3 bg-white/10 hover:bg-white/15 text-left transition-colors"
            >
              <div className="font-medium">{z.label}</div>
              <div className="text-xs text-muted-foreground">{z.key}</div>
            </Button>
          ))}
          <Button className="rounded-xl p-3 bg-white/10 hover:bg-white/15 text-left" type="button" onClick={() => onSelect({ type: 'openMap' })}>
            <div className="font-medium">Control</div>
            <div className="text-xs text-muted-foreground">Roadmaps & Tasks</div>
          </Button>
          <Button className="rounded-xl p-3 bg-white/10 hover:bg-white/15 text-left" type="button" onClick={() => onSelect({ type: 'voiceNote' })}>
            <div className="font-medium">Archive</div>
            <div className="text-xs text-muted-foreground">Notes & Audio</div>
          </Button>
        </div>
      </div>
    </div>
  );
}
