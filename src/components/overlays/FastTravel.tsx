import { useEffect, useState } from "react";

const ZONES = [
  { key: 'focus', label: 'Training Grounds', event: 'mos:startFocus' },
  { key: 'hypno', label: 'Hypno Temple', event: 'open-hypno-panel' },
  { key: 'voice', label: 'Sound Studio', event: 'mos:voiceNote' },
  { key: 'notes', label: 'Idea Forest', event: 'mos:addNote' },
  { key: 'analyze', label: 'Arena', event: 'mos:openAnalyze' },
];

export default function FastTravel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('open-fast-travel', h as any);
    return () => window.removeEventListener('open-fast-travel', h as any);
  }, []);

  if (!open) return null;

  const onSelect = (eventName: string) => {
    setOpen(false);
    document.dispatchEvent(new CustomEvent(eventName));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="glass-panel rounded-t-2xl md:rounded-2xl w-full md:w-[640px] p-4 elev">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Portal Plaza</h3>
          <button className="rounded-full px-3 py-1 bg-secondary" onClick={()=>setOpen(false)}>Close</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {ZONES.map(z => (
            <button key={z.key}
              onClick={() => onSelect(z.event)}
              className="rounded-xl p-3 bg-white/10 hover:bg-white/15 text-left transition-colors"
            >
              <div className="font-medium">{z.label}</div>
              <div className="text-xs text-muted-foreground">{z.key}</div>
            </button>
          ))}
          <button className="rounded-xl p-3 bg-white/10 hover:bg-white/15 text-left" onClick={() => onSelect('mos:openMap')}>
            <div className="font-medium">Control</div>
            <div className="text-xs text-muted-foreground">Roadmaps & Tasks</div>
          </button>
          <button className="rounded-xl p-3 bg-white/10 hover:bg-white/15 text-left" onClick={() => onSelect('mos:voiceNote')}>
            <div className="font-medium">Archive</div>
            <div className="text-xs text-muted-foreground">Notes & Audio</div>
          </button>
        </div>
      </div>
    </div>
  );
}
