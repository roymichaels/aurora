import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRICING_TIERS } from '@/modules/payments/components/PricingPage';
import BrainBackupPanel from '@/components/settings/BrainBackupPanel';
import { memoryStore } from '@/memory/indexedDbMemory';
import { toast } from '@/hooks/use-toast';

export default function AccountPlan() {
  const freeTier = PRICING_TIERS.find((t) => t.id === 'freemium');
  const proTier = PRICING_TIERS.find((t) => t.id === 'pro');
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      memoryStore.importAll({ semantic: [], episodic: [], procedural: [] });
      toast({ title: 'Brain cleared', description: 'All local memories removed.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative min-h-svh">
      <div className="os-bg" />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <section>
          <h1 className="text-2xl font-semibold mb-4">Account Plan</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {freeTier?.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {proTier?.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {proTier && (
                  <Button className="mt-4" onClick={() => (window.location.href = '/pricing')}>
                    {`Upgrade – $${proTier.price.monthly}/mo`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Privacy</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Your brain lives on this device.
          </p>
          <div className="flex flex-col gap-4">
            <Button variant="destructive" onClick={handleClear} disabled={clearing} className="w-fit">
              {clearing ? 'Clearing…' : 'Clear'}
            </Button>
            <BrainBackupPanel />
          </div>
        </section>
      </main>
    </div>
  );
}
