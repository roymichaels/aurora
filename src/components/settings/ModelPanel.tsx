import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type ModelPreference = 'auto' | 'local' | 'remote';

export default function ModelPanel() {
  const [pref, setPref] = useLocalStorage<ModelPreference>('settings.modelPreference', 'auto');

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Model Preference</h2>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <Label htmlFor="model-preference">Preferred model</Label>
        <Select value={pref} onValueChange={(v) => setPref(v as ModelPreference)}>
          <SelectTrigger id="model-preference">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (remote with fallback)</SelectItem>
              <SelectItem value="remote">Remote (cloud)</SelectItem>
            <SelectItem value="local">Local (on-device)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Messages may use the local model when offline or on slow networks.
      </p>
    </div>
  );
}
