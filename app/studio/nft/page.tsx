'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useNearAuth } from '@/hooks/useNearAuth';

const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || process.env.ADMIN_WALLETS || '')
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);
const ipfsGateway = (cid: string) => `${process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'}/${cid}`;

interface Asset { key: string; cid: string; updatedAt: string }
// [AURORA-BEGIN:studio-ui]
interface AssetCardProps {
  label: string;
  assetKey: string;
  cid?: string;
  onFile: (key: string, file: File | null) => void;
  onSvg: (key: string, svg: string) => void;
}

function AssetCard({ label, assetKey, cid, onFile, onSvg }: AssetCardProps) {
  const [svg, setSvg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {cid && <img src={ipfsGateway(cid)} alt={assetKey} className="h-32 w-32 object-contain" />}
        <div className="text-xs break-all">{cid || 'No CID'}</div>
        <Input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={e => onFile(assetKey, e.target.files?.[0] || null)}
        />
        <Button onClick={() => fileRef.current?.click()}>Upload PNG/SVG</Button>
        <Textarea
          placeholder="<svg ... />"
          value={svg}
          onChange={e => setSvg(e.target.value)}
        />
        <Button onClick={() => onSvg(assetKey, svg)}>Pin SVG</Button>
      </CardContent>
    </Card>
  );
}

export default function NFTAssetStudioPage() {
  const { accountId, login } = useNearAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [badgeKeys, setBadgeKeys] = useState<string[]>(['first_journal', 'streak_7', 'focus_5']);
  const [newBadge, setNewBadge] = useState('');

  const refreshAssets = async () => {
    const res = await fetch('/nft/assets', { credentials: 'include' });
    if (!res.ok) throw new Error('unauthorized');
    const data = await res.json();
    setAssets(data);
  };

  useEffect(() => {
    if (!accountId) return;
    const isAdmin = adminWallets.includes(accountId.toLowerCase());
    if (isAdmin) {
      setAuthorized(true);
      refreshAssets().catch(() => {});
    } else {
      refreshAssets()
        .then(() => setAuthorized(true))
        .catch(() => setAuthorized(false));
    }
  }, [accountId]);

  const handleFile = async (key: string, file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append('key', key);
    form.append('file', file);
    const res = await fetch('/nft/assets/pin-file', { method: 'POST', body: form });
    if (res.ok) {
      toast({ title: 'Pinned', description: key });
      await refreshAssets();
    } else {
      toast({ title: 'Pin failed', description: key, variant: 'destructive' });
    }
  };

  const handleSvg = async (key: string, svg: string) => {
    const res = await fetch('/nft/assets/pin-svg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, svg }),
    });
    if (res.ok) {
      toast({ title: 'Pinned', description: key });
      await refreshAssets();
    } else {
      toast({ title: 'Pin failed', description: key, variant: 'destructive' });
    }
  };

  const addBadge = () => {
    const k = newBadge.trim();
    if (k && !badgeKeys.includes(k)) setBadgeKeys([...badgeKeys, k]);
    setNewBadge('');
  };

  if (!accountId) {
    return (
      <div className="p-4">
        <Button onClick={() => login()}>Connect Admin Wallet</Button>
      </div>
    );
  }
  if (!authorized) {
    return <div className="p-4">Not authorized</div>;
  }

  const getCid = (key: string) => assets.find(a => a.key === key)?.cid;

  return (
    <div className="p-4 space-y-6">
      <AssetCard label="AuroraID" assetKey="auroraid/base" cid={getCid('auroraid/base')} onFile={handleFile} onSvg={handleSvg} />
      <AssetCard label="Season Pass" assetKey="seasonpass/base" cid={getCid('seasonpass/base')} onFile={handleFile} onSvg={handleSvg} />
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {badgeKeys.map(bk => (
            <AssetCard key={bk} label={bk} assetKey={`badge/${bk}`} cid={getCid(`badge/${bk}`)} onFile={handleFile} onSvg={handleSvg} />
          ))}
          <div className="flex space-x-2">
            <Input value={newBadge} onChange={e => setNewBadge(e.target.value)} placeholder="new badge key" />
            <Button onClick={addBadge}>Add badge key</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// [AURORA-END:studio-ui]

