import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function DataSourcesPanel() {
  const [google, setGoogle] = useLocalStorage('consent.googleCalendar', false);
  const [evernote, setEvernote] = useLocalStorage('consent.evernote', false);
  const [notion, setNotion] = useLocalStorage('consent.notion', false);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Data Sources</h2>
      <div className="flex items-center justify-between max-w-sm">
        <Label htmlFor="consent-google">Google Calendar</Label>
        <Switch id="consent-google" checked={google} onCheckedChange={setGoogle} />
      </div>
      <div className="flex items-center justify-between max-w-sm">
        <Label htmlFor="consent-evernote">Evernote</Label>
        <Switch id="consent-evernote" checked={evernote} onCheckedChange={setEvernote} />
      </div>
      <div className="flex items-center justify-between max-w-sm">
        <Label htmlFor="consent-notion">Notion</Label>
        <Switch id="consent-notion" checked={notion} onCheckedChange={setNotion} />
      </div>
      <p className="text-sm text-muted-foreground">
        Toggle access for each integration. Only enabled sources will sync into your memory.
      </p>
    </div>
  );
}
