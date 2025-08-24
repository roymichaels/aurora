import { useEffect, useState } from "react";
import { TonConnectUI } from "@tonconnect/ui";

let tonConnectUI: TonConnectUI | null = null;

export function useTonAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!tonConnectUI) {
    tonConnectUI = new TonConnectUI({ manifestUrl: "/tonconnect-manifest.json" });
  }

  useEffect(() => {
    setAddress(tonConnectUI!.account?.address ?? null);
    const unsubscribe = tonConnectUI!.onStatusChange(wallet => {
      setAddress(wallet?.account.address ?? null);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const connect = async () => {
    if (!tonConnectUI) return;
    setIsConnecting(true);
    try {
      await tonConnectUI.connectWallet();
      const start = await fetch("/auth/ton/start", { method: "POST" });
      const { challenge } = (await start.json()) as { challenge: string };
      const signed = await tonConnectUI.signData({ type: "text", text: challenge });
      const verify = await fetch("/auth/ton/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: signed.address,
          signature: signed.signature,
          challenge,
        }),
      });
      if (verify.ok) {
        setAddress(signed.address);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!tonConnectUI) return;
    await tonConnectUI.disconnect();
    setAddress(null);
  };

  return { connect, disconnect, address, isConnecting };
}
