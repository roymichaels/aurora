import { useEffect, useState } from "react";
import { TonConnectUI } from "@tonconnect/ui";

export function useTonAuth() {
  const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const tonConnect = new TonConnectUI({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
    });
    setTonConnectUI(tonConnect);
  }, []);

  const connect = async () => {
    if (!tonConnectUI) return;
    setIsConnecting(true);
    try {
      await tonConnectUI.connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  return { connect, isConnecting };
}
