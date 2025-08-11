import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFeatureFlags } from '@/state/featureFlags';

export default function FeatureFlagsPanel() {
  const { hypnosisScripts, cloudRouting, voiceStorage, toggle } = useFeatureFlags();
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Feature Toggles</h2>
      <div className="flex items-center justify-between max-w-sm">
        <Label htmlFor="flag-hypnosis">Hypnosis Scripts</Label>
        <Switch id="flag-hypnosis" checked={hypnosisScripts} onCheckedChange={() => toggle('hypnosisScripts')} />
      </div>
      <div className="flex items-center justify-between max-w-sm">
        <Label htmlFor="flag-cloud">Cloud Routing</Label>
        <Switch id="flag-cloud" checked={cloudRouting} onCheckedChange={() => toggle('cloudRouting')} />
      </div>
      <div className="flex items-center justify-between max-w-sm">
        <Label htmlFor="flag-voice">Voice Storage</Label>
        <Switch id="flag-voice" checked={voiceStorage} onCheckedChange={() => toggle('voiceStorage')} />
      </div>
    </div>
  );
}
