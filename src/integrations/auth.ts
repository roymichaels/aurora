import { tonConnectUI } from "@/hooks/useTonAuth";

export interface TonUser {
  id: string;
  email: string;
}

export async function getTonUser(): Promise<TonUser | null> {
  const address = tonConnectUI.wallet?.account.address;
  return address ? { id: address, email: address } : null;
}
