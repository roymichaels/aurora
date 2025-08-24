import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { generateKeyShards, restoreKeyFromShards } from '@/state/keyManager';

async function encryptShare(share: string, passphrase: string, address: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(passphrase + address));
  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = enc.encode(share);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  const out = new Uint8Array(iv.length + encrypted.length);
  out.set(iv, 0);
  out.set(encrypted, iv.length);
  return btoa(String.fromCharCode(...out));
}

async function decryptShare(payload: string, passphrase: string, address: string): Promise<string> {
  const raw = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(passphrase + address));
  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['decrypt']);
  const decrypted = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data));
  return new TextDecoder().decode(decrypted);
}

export default function KeyRecoveryPanel() {
  const [guardianList, setGuardianList] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [passphrase, setPassphrase] = useState('');
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [restorePass, setRestorePass] = useState('');
  const [restoreShares, setRestoreShares] = useState('');

  const generate = async () => {
    const guardians = guardianList.split('\n').map(s => s.trim()).filter(Boolean);
    if (!guardians.length) {
      toast({ title: 'No guardians', description: 'Enter guardian wallet addresses.' });
      return;
    }
    if (!passphrase) {
      toast({ title: 'Passphrase required', description: 'Set an encryption passphrase.' });
      return;
    }
    try {
      const shards = generateKeyShards(guardians.length, threshold);
      const encrypted = await Promise.all(guardians.map((g, i) => encryptShare(shards[i], passphrase, g)));
      localStorage.setItem('recovery.data', JSON.stringify({ threshold, guardians, shares: encrypted }));
      setGenerated(shards);
      toast({ title: 'Shards generated', description: 'Distribute the shards to guardians.' });
    } catch (e) {
      toast({ title: 'Generation failed', description: String(e) });
    }
  };

  const loadSaved = async () => {
    try {
      const raw = localStorage.getItem('recovery.data');
      if (!raw) {
        toast({ title: 'No recovery data', description: 'Generate shards first.' });
        return;
      }
      const { guardians, shares } = JSON.parse(raw) as { guardians: string[]; shares: string[] };
      const dec = await Promise.all(guardians.map((g, i) => decryptShare(shares[i], restorePass, g)));
      setRestoreShares(dec.join('\n'));
    } catch (e) {
      toast({ title: 'Load failed', description: String(e) });
    }
  };

  const restore = () => {
    const shards = restoreShares.split('\n').map(s => s.trim()).filter(Boolean);
    const stored = localStorage.getItem('recovery.data');
    const required = stored ? (JSON.parse(stored).threshold as number) : 2;
    if (shards.length < required) {
      toast({ title: 'Not enough shards', description: `Need at least ${required}.` });
      return;
    }
    try {
      const key = restoreKeyFromShards(shards);
      if (key) {
        toast({ title: 'Key restored', description: 'Data key has been reconstructed.' });
      }
    } catch (e) {
      toast({ title: 'Restore failed', description: String(e) });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Key Recovery</h2>
      <div className="space-y-2 max-w-sm">
        <Label htmlFor="guardian-list">Guardian Wallets</Label>
        <Textarea
          id="guardian-list"
          value={guardianList}
          onChange={e => setGuardianList(e.target.value)}
          placeholder="wallet1\nwallet2"
        />
        <Label htmlFor="threshold">Threshold</Label>
        <Input
          id="threshold"
          type="number"
          min={1}
          value={threshold}
          onChange={e => setThreshold(parseInt(e.target.value, 10))}
        />
        <Label htmlFor="passphrase">Encryption Passphrase</Label>
        <Input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
        />
        <Button variant="outline" onClick={generate}>Generate Shards</Button>
      </div>
      {generated && (
        <div className="space-y-2 max-w-sm">
          <Label>Generated Shares</Label>
          <Textarea readOnly value={generated.join('\n')} />
        </div>
      )}
      <div className="space-y-2 max-w-sm pt-4">
        <Label htmlFor="restore-pass">Restore Passphrase</Label>
        <Input
          id="restore-pass"
          type="password"
          value={restorePass}
          onChange={e => setRestorePass(e.target.value)}
        />
        <Button variant="outline" onClick={loadSaved}>Load Encrypted Shares</Button>
        <Label htmlFor="restore-shares">Shares</Label>
        <Textarea
          id="restore-shares"
          value={restoreShares}
          onChange={e => setRestoreShares(e.target.value)}
          placeholder="Paste shares here"
        />
        <Button onClick={restore}>Restore Key</Button>
      </div>
    </div>
  );
}
