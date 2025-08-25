import { useEffect, useRef, useState } from "react";
import { CHAIN, TonConnectUI } from "@tonconnect/ui";
import { setDataKey } from "@/state/keyManager";
import { db as localDb } from "@/data/db";

// Create a single TonConnectUI instance for the app. All connections must use the TON testnet.
export const connector = new TonConnectUI({
  manifestUrl: "/tonconnect-manifest.json",
});

function composeMessage(
  challenge: string,
  scopes: string[] = [],
  sessionPubKey?: string,
  exp?: number,
): string {
  return [
    challenge,
    sessionPubKey || "",
    exp ? String(exp) : "",
    scopes.join(","),
  ].join("|");
}

export function useTonAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = connector.onStatusChange((wallet) => {
      setAddress(wallet?.account.address ?? null);
    });
    return unsubscribe;
  }, []);

  const signAndVerify = async (scopes: string[] = []) => {
    const res = await fetch("/auth/ton/start", { method: "POST" });
    const { challenge } = await res.json();
    const message = composeMessage(challenge, scopes);
    const { signature } = await connector.signData({
      type: "text",
      text: message,
      network: CHAIN.TESTNET,
    });
    const publicKey = connector.wallet?.account.publicKey;
    if (!publicKey) throw new Error("missing_public_key");
    const hexSignature = Buffer.from(signature, "base64").toString("hex");
    await fetch("/auth/ton/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey,
        signature: hexSignature,
        challenge,
        scopes,
      }),
    });
    const addr = connector.wallet?.account.address;
    setAddress(addr || null);
  };

  const login = async (scopes: string[] = []) => {
    setLoading(true);
    try {
      if (!connector.wallet) {
        try {
          await connector.tonConnect.connectWallet({ chain: CHAIN.TESTNET });
        } catch (err) {
          console.error("Wallet connection failed", err);
          throw err;
        }

      }
      if (connector.wallet?.account.chain !== CHAIN.TESTNET) {
        console.warn("Wallet is not on TON testnet");
        throw new Error("Only TON testnet is supported");
      }
      await signAndVerify(scopes);
      // ensure a data key exists for encrypted Dexie storage
      const key = crypto.getRandomValues(new Uint8Array(32));
      setDataKey(key);
      try {
        await localDb.open();
      } catch {
        /* ignore db open errors */
      }
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      refreshTimer.current = setInterval(
        () => {
          signAndVerify(scopes).catch(() => {
            /* ignore refresh errors */
          });
        },
        50 * 60 * 1000,
      ); // refresh roughly every 50 minutes
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      await connector.disconnect();
      setAddress(null);
    }
  };

  return { address, login, logout, loading };
}
