import { supabase } from "@/integrations/db";

export interface StoreRecord {
  id: string;
  name: string;
  owner: string;
  nftId: string;
}

export async function mintStoreNFT({
  name,
  owner,
}: {
  name: string;
  owner: string;
}): Promise<StoreRecord> {
  const id = crypto.randomUUID();
  const nftId = crypto.randomUUID();
  const record: StoreRecord = { id, name, owner, nftId };

  await supabase.from("stores").insert(record);
  return record;
}
