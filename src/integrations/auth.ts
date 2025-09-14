import { getWallet } from "@/lib/near";

export interface AuthUser {
  id: string;
  email: string;
}

export async function getNearUser(): Promise<AuthUser | null> {
  const wallet = await getWallet();
  const accountId = wallet.getAccountId();
  return accountId ? { id: accountId, email: accountId } : null;
}
