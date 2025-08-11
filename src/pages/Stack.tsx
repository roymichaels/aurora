import { useEffect, useMemo } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

const setMeta = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const setJsonLd = (id: string, data: object) => {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

export default function StackPage() {
  const platform = useMemo(() => Capacitor.getPlatform?.() ?? "web", []);
  const isNative = useMemo(() => Capacitor.isNativePlatform?.() ?? false, []);

  const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasSTT = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const hasExtension =
    typeof window !== "undefined" &&
    typeof window.chrome !== "undefined" &&
    !!window.chrome?.runtime?.id;
  const online = typeof navigator !== "undefined" && navigator.onLine;
  const supabaseReady = !!supabase;

  useEffect(() => {
    const title = "Aurora OS Tech Stack & Runtime"; // <60 chars
    document.title = title;
    setMeta("description", "Aurora OS tech stack details and live runtime diagnostics.");
    setCanonical(window.location.href.split("#")[0]);

    setJsonLd("ld-tech-stack", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Aurora OS – Mind Operating System",
      applicationCategory: "Productivity",
      operatingSystem: "Web, iOS, Android",
      url: window.location.origin,
      description: "Tech stack and diagnostics for the Aurora OS web app.",
    });
  }, []);

  return (
    <div className="relative min-h-svh">
      <div className="os-bg" />
      <AppHeader />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <article className="space-y-8">
          <header>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Aurora OS Tech Stack</h1>
            <p className="mt-2 text-sm text-muted-foreground">Overview of frameworks, libraries, and live environment diagnostics.</p>
          </header>

          <section aria-labelledby="diagnostics" className="glass-panel rounded-xl p-4 elev">
            <h2 id="diagnostics" className="text-lg font-medium mb-3">Runtime diagnostics</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Platform</dt>
                <dd className="font-medium">{platform}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Native (Capacitor)</dt>
                <dd className="font-medium">{isNative ? "yes" : "no"}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Extension detected</dt>
                <dd className="font-medium">{hasExtension ? "yes" : "no"}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Voice: TTS</dt>
                <dd className="font-medium">{hasTTS ? "available" : "unavailable"}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Voice: STT (Web Speech)</dt>
                <dd className="font-medium">{hasSTT ? "available" : "unavailable"}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Supabase client</dt>
                <dd className="font-medium">{supabaseReady ? "initialized" : "not ready"}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="font-medium">{online ? "online" : "offline"}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="core" className="glass-panel rounded-xl p-4 elev">
            <h2 id="core" className="text-lg font-medium mb-3">Core web app</h2>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Framework: React 18 + TypeScript</li>
              <li>Build tool: Vite (SWC React)</li>
              <li>Styling: Tailwind CSS + shadcn/ui (Radix primitives)</li>
              <li>Routing: React Router v6</li>
              <li>Data: TanStack Query + Zustand</li>
              <li>Forms/validation: react-hook-form + zod</li>
              <li>UI/UX libs: Radix, Sonner, date-fns, embla-carousel, recharts, lucide-react</li>
              <li>Game/interactive: Phaser 3 (MindWorld)</li>
              <li>Voice: Web Speech API wrapper (PTT STT + speechSynthesis)</li>
            </ul>
          </section>

          <section aria-labelledby="backend" className="glass-panel rounded-xl p-4 elev">
            <h2 id="backend" className="text-lg font-medium mb-3">Backend & integrations</h2>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Supabase (auth, DB, edge functions)</li>
              <li>Edge function: supabase/functions/tts-generate</li>
              <li>Client-side app with Supabase functions for server needs</li>
            </ul>
          </section>

          <section aria-labelledby="mobile" className="glass-panel rounded-xl p-4 elev">
            <h2 id="mobile" className="text-lg font-medium mb-3">Mobile builds</h2>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Capacitor 6 (iOS/Android) wrapping the web app</li>
              <li>Same React/Vite bundle loaded in a native WebView</li>
            </ul>
          </section>

          <section aria-labelledby="extension" className="glass-panel rounded-xl p-4 elev">
            <h2 id="extension" className="text-lg font-medium mb-3">Browser extension</h2>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Chrome/Edge MV3 (aurora-extension)</li>
              <li>Content script overlay + background service worker</li>
              <li>Vanilla JS for extension bundle</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}
