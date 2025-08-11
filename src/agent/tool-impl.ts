import { toast } from "@/components/ui/use-toast";

export const ToolImpl = {
  async get_page_context() {
    const sel = (typeof window !== 'undefined' ? window.getSelection()?.toString() : '') || '';
    const meta = typeof document !== 'undefined' ? (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content || '' : '';
    const canonical = typeof document !== 'undefined' ? (document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null)?.href || '' : '';
    return {
      url: typeof location !== 'undefined' ? location.href : '',
      title: typeof document !== 'undefined' ? document.title : '',
      selection: sel,
      meta,
      canonical,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      language: typeof document !== 'undefined' ? document.documentElement.lang || navigator.language : navigator.language,
    };
  },

  async summarize_selection({ length = 'short' as 'short' | 'medium' | 'long' }) {
    // Placeholder: will be routed via extension for full-page summaries
    const selection = window.getSelection()?.toString() || '';
    const base = selection || (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content || 'No obvious content to summarize.';
    const summary = `${base.slice(0, 200)}${base.length > 200 ? '…' : ''}`;
    toast({ title: "Summary", description: summary });
    return { summary };
  },

  async clip_note({ text, tags }: { text: string; tags?: string[] }) {
    try {
      if (!navigator?.clipboard) {
        toast({ title: "Clipboard unsupported", description: "Clipboard isn’t supported" });
        return { ok: false } as any;
      }
      // Minimal local clipboard as placeholder for Notes feature
      await navigator.clipboard.writeText(text);
      toast({ title: "Clipped to clipboard", description: (tags && tags.length) ? `Tags: ${tags.join(', ')}` : undefined });
      return { ok: true };
    } catch (e) {
      toast({ title: "Clipboard error", description: e instanceof Error ? e.message : String(e) });
      return { ok: false } as any;
    }
  },

  async start_focus({ minutes = 25, hypnosis }: { minutes?: number; hypnosis?: 'focus' | 'calm' | 'confidence' | null }) {
    minutes = Math.round(minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
      toast({ title: "Invalid duration", description: "Minutes must be between 1 and 180." });
      return { ok: false } as any;
    }
    if (hypnosis) {
      window.dispatchEvent(new CustomEvent('mos', { detail: { type: 'startHypnosis' } }));
    }
    window.dispatchEvent(new CustomEvent('mos', { detail: { type: 'startFocus' } }));
    toast({ title: `Focus started`, description: `${minutes} minutes${hypnosis ? ` · with ${hypnosis}` : ''}` });
    return { ok: true };
  },

  async start_hypnosis({ mode, duration = 60 }: { mode: 'focus' | 'calm' | 'confidence' | 'reset'; duration?: number }) {
    duration = Math.round(duration);
    if (!Number.isFinite(duration) || duration < 1 || duration > 600) {
      toast({ title: "Invalid duration", description: "Duration must be between 1 and 600 seconds." });
      return { ok: false } as any;
    }
    window.dispatchEvent(new CustomEvent('mos', { detail: { type: 'startHypnosis' } }));
    toast({ title: `Hypnosis: ${mode}`, description: `${duration}s` });
    return { ok: true };
  },

  async block_sites({ domains, minutes = 25 }: { domains: string[]; minutes?: number }) {
    // Placeholder - extension will enforce blocks
    toast({ title: "Distraction Shield (preview)", description: `Blocking ${domains.slice(0,3).join(', ')}${domains.length>3? '…':''} for ${minutes}m` });
    return { ok: true };
  },

  async fill_form({ text }: { text: string }) {
    if (!navigator?.clipboard) {
      toast({ title: "Clipboard unsupported", description: "Clipboard isn’t supported" });
      return { ok: false } as any;
    }
    // Basic fallback: copy to clipboard for paste
    await navigator.clipboard.writeText(text);
    toast({ title: "Ready to paste", description: "Text copied to clipboard" });
    return { ok: true };
  },

  async copy_to_clipboard({ text }: { text: string }) {
    if (!navigator?.clipboard) {
      toast({ title: "Clipboard unsupported", description: "Clipboard isn’t supported" });
      return { ok: false } as any;
    }
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: text.length > 60 ? `${text.slice(0, 60)}…` : text });
    return { ok: true };
  },

  async notify({ title, body }: { title: string; body?: string }) {
    toast({ title, description: body });
    return { ok: true };
  },
};
