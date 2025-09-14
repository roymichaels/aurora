import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FocusFlame from "@/components/mascot/FocusFlame";

const copy = {
    hero: {
      headline: "Your Mind. Your World. Your Focus.",
      subheadline: "Enter a hypnosis-powered game world that grows with your focus and habits.",
      ctaPrimary: "Enter Your World Free",
      ctaSecondary: "See how it works",
      micro: "No credit card · Cancel anytime."
    },
  socialProof: {
    title: "Loved by focused builders",
    quotes: [
      "Keeps me on one task. Finally.",
      "The vibe is calm. I actually want to open it.",
      "My streak is the only streak I care about now."
    ]
  },
  howItWorks: {
    title: "How it works",
    steps: [
      { title: "Set your intent", body: "Pick one focus task from your roadmap." },
      { title: "Enter Flow", body: "Start a session and let distractions fade." },
      { title: "Track Progress", body: "Small steps, big wins. Earn XP as you go." }
    ]
  },
  features: {
    title: "Features",
    cards: [
      { title: "Live Focus", body: "A hero card that centers your day." },
      { title: "Mood-Aware", body: "Tone and gradients respond to how you feel." },
      { title: "Swipe Panels", body: "Navigate Live, Control, and Archive with a swipe." }
    ]
  },
  ctaBlock: {
    headline: "Ready to focus?",
    body: "Join free and bring calm clarity to your work.",
    ctaPrimary: "Get Started Free",
    ctaSecondary: "Learn more"
  },
  faq: [
    { q: "Is it free?", a: "Yes, start free. Upgrade options may come later." },
    { q: "Do I need a credit card?", a: "No. Just connect your NEAR wallet to sign in." },
    { q: "Will it work on mobile?", a: "Yes. It's built mobile-first and safe-area aware." }
  ],
  footer: {
    tagline: "Built for calm focus.",
    links: ["Privacy", "Terms", "Contact"]
  }
};

export default function LandingPage() {
  useEffect(() => {
    document.title = "MOS – Your Mind World";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Hypnosis-powered game world for focus. Build streaks, earn XP, grow your hub.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description"; m.content = desc; document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="relative min-h-svh pb-safe">
      <div className="os-bg" />
      <header className="px-4 pt-4 flex items-center justify-between max-w-4xl mx-auto">
        <div className="font-semibold tracking-wide">MOS</div>
        <div className="flex items-center gap-3">
          <a href="#how" className="text-sm text-muted-foreground story-link">How it works</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {/* HERO */}
        <section className="mt-10 glass-panel rounded-2xl p-6 elev hero-ambient animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <FocusFlame size={56} />
            <span className="text-sm text-muted-foreground">I’ll help you stay on fire.</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{copy.hero.headline}</h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-4">{copy.hero.subheadline}</p>
          <div className="flex items-center gap-3">
            <Button asChild variant="primary" className="h-11 rounded-xl px-5 motion-safe:active:scale-95">
              <Link to="/auth">{copy.hero.ctaPrimary}</Link>
            </Button>
            <a href="#how" className="underline text-sm opacity-90 hover:opacity-100">{copy.hero.ctaSecondary}</a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{copy.hero.micro}</p>
        </section>

        {/* SOCIAL PROOF */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3">{copy.socialProof.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {copy.socialProof.quotes.map((q, i) => (
              <Card key={i} className="p-4 bg-secondary">{q}</Card>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mt-8">
          <h3 className="text-lg font-semibold mb-3">{copy.howItWorks.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {copy.howItWorks.steps.map((s, i) => (
              <Card key={i} className="p-5 bg-secondary">
                <div className="font-semibold mb-2">{s.title}</div>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3">{copy.features.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {copy.features.cards.map((c, i) => (
              <Card key={i} className="p-5 bg-secondary">
                <div className="font-semibold mb-2">{c.title}</div>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10">
          <Card className="p-6 bg-secondary">
            <h3 className="text-2xl font-semibold mb-2">{copy.ctaBlock.headline}</h3>
            <p className="opacity-85 mb-4">{copy.ctaBlock.body}</p>
            <div className="flex items-center gap-3">
              <Button asChild variant="primary" className="h-11 rounded-xl px-5 motion-safe:active:scale-95">
                <Link to="/auth">{copy.ctaBlock.ctaPrimary}</Link>
              </Button>
              <a href="#" className="underline opacity-90 hover:opacity-100">{copy.ctaBlock.ctaSecondary}</a>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mt-8">
          <div className="grid gap-4">
            {copy.faq.map((f, i) => (
              <Card key={i} className="p-5 bg-secondary">
                <div className="font-semibold mb-1">{f.q}</div>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-10 opacity-80">
          <div className="mb-3">{copy.footer.tagline}</div>
          <div className="flex gap-4 text-sm">
            {copy.footer.links.map((l) => (
              <a key={l} href="#" className="hover:opacity-100 text-muted-foreground">{l}</a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
