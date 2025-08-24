import { useEffect, useState } from "react";
import { TonConnectUI } from "@tonconnect/ui";

// Create a single TonConnectUI instance for the app
const connector = new TonConnectUI({
  manifestUrl: "/tonconnect-manifest.json",
});

export function useTonAuth() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = connector.onStatusChange((wallet) => {
      setAddress(wallet?.account.address ?? null);
    });
    return unsubscribe;
  }, []);

  const disconnect = async () => {
    await connector.disconnect();
  };

  return { address, disconnect };
}

