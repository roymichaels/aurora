import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { mintStoreNFT, type StoreRecord } from "@/agent/stores-agent";

export default function StoreCreation() {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const { user } = useSupabaseAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setCreating(true);
    try {
      const created = await mintStoreNFT({ name, owner: user?.id ?? "" });
      setStore(created);
      setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Store name"
      />
      <Button type="submit" disabled={creating || !name}>
        {creating ? "Creating..." : "Create Store"}
      </Button>
      {store && (
        <p className="text-sm text-muted-foreground">
          Minted store NFT {store.nftId}
        </p>
      )}
    </form>
  );
}
