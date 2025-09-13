import { useEffect, useState } from "react";
import { connect, keyStores, WalletConnection } from "near-api-js";

let wallet: WalletConnection | null = null;

async function getWalletConnection(): Promise<WalletConnection> {
  if (!wallet) {
    const config = {
      networkId: "testnet",
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: "https://rpc.testnet.near.org",
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
    } as const;
    const near = await connect(config as any);
    wallet = new WalletConnection(near, null);
  }
  return wallet;
}

export function useNearAuth() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWalletConnection().then((w) => {
      if (w.isSignedIn()) setAccountId(w.getAccountId());
    });
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const w = await getWalletConnection();
      await w.requestSignIn();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const w = await getWalletConnection();
    w.signOut();
    setAccountId(null);
  };

  return { accountId, login, logout, loading };
}
