import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTonSession } from "@/hooks/useTonSession";
import { mintStoreNFT, type StoreRecord } from "@/agent/stores-agent";

export default function StoreCreation() {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useTonSession();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("You must be logged in to create a store.");
      return;
    }
    if (!name) return;
    setCreating(true);
    try {
      const created = await mintStoreNFT({ name, owner: user.id });
      setStore(created);
      setName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create store."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Store name"
        />
        <Button type="submit" disabled={creating || !name || !user}>
          {creating ? "Creating..." : "Create Store"}
        </Button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {store && (
        <p className="mt-2 text-sm text-muted-foreground">
          Minted store NFT {store.nftId}
        </p>
      )}
    </>
  );
}
