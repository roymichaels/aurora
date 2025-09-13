import { useEffect, useState } from "react";
import { getWallet } from "@/lib/near";

export function useTonAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const wallet = await getWallet();
      if (wallet.isSignedIn()) {
        setAddress(wallet.getAccountId());
      }
    })();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const wallet = await getWallet();
      if (!wallet.isSignedIn()) {
        await wallet.requestSignIn();
      }
      setAddress(wallet.getAccountId());
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const wallet = await getWallet();
    wallet.signOut();
    setAddress(null);
  };

  return { address, login, logout, loading };
}
