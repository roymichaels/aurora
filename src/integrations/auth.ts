import { getTonConnectUI } from "@/lib/tonconnect";

export interface TonUser {
  id: string;
  email: string;
}

export async function getTonUser(): Promise<TonUser | null> {
  const tonConnectUI = getTonConnectUI();
  const address = tonConnectUI.wallet?.account.address;
  return address ? { id: address, email: address } : null;
}
