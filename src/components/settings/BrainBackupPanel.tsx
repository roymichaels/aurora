import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { exportEncryptedBrain, importEncryptedBrain } from '@/memory/brainBackup';
import { openBrainDb } from '@/memory/brainDb';

export default function BrainBackupPanel() {
  const [passphrase, setPassphrase] = useLocalStorage<string>('brain.backup.passphrase', '');
  const [enabled, setEnabled] = useLocalStorage<boolean>('brain.backup.enabled', false);
  const [encryptEnabled, setEncryptEnabled] = useLocalStorage<boolean>('brain.encrypt.enabled', false);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!passphrase) {
      toast({ title: 'Passphrase required', description: 'Set a passphrase first.' });
      return;
    }
    setBusy(true);
    try {
      const blob = await exportEncryptedBrain(passphrase);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brain.aurora';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Brain exported', description: 'Encrypted brain downloaded.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Export failed', description: 'Could not export brain.' });
    } finally {
      setBusy(false);
    }
  };

  const restore = () => {
    if (!passphrase) {
      toast({ title: 'Passphrase required', description: 'Set a passphrase first.' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.aurora';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        await importEncryptedBrain(file, passphrase);
        toast({ title: 'Brain restored', description: 'Reloading…' });
        location.reload();
      } catch (e) {
        console.error(e);
        toast({ title: 'Restore failed', description: 'Could not restore brain.' });
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Brain Backup</h2>
      <div className="space-y-2 max-w-sm">
        <Label htmlFor="brain-pass">Passphrase</Label>
        <Input
          id="brain-pass"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="brain-weekly" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="brain-weekly">Upload weekly to cloud</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="brain-encrypt"
          checked={encryptEnabled}
          onCheckedChange={async (checked) => {
            if (checked && !passphrase) {
              toast({ title: 'Passphrase required', description: 'Set a passphrase first.' });
              return;
            }
            localStorage.setItem('brain.encrypt.enabled', JSON.stringify(checked));
            setEncryptEnabled(checked);
            const db = await openBrainDb();
            await db.saveToDisk();
            toast({
              title: checked ? 'Brain encrypted' : 'Encryption disabled',
              description: checked ? 'Database stored encrypted.' : 'Database stored unencrypted.',
            });
          }}
        />
        <Label htmlFor="brain-encrypt">Encrypt brain on disk</Label>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={download} disabled={busy}>
          Download Brain
        </Button>
        <Button variant="outline" onClick={restore} disabled={busy}>
          Restore Brain
        </Button>
      </div>
    </div>
  );
}
