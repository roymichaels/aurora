import { connect, keyStores, WalletConnection } from "near-api-js";

let walletPromise: Promise<WalletConnection> | null = null;

async function initWallet(): Promise<WalletConnection> {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const near = await connect({
    networkId: import.meta.env.VITE_NEAR_NETWORK_ID,
    nodeUrl: import.meta.env.VITE_NEAR_NODE_URL,
    walletUrl: import.meta.env.VITE_NEAR_WALLET_URL,
    helperUrl: import.meta.env.VITE_NEAR_HELPER_URL,
    deps: { keyStore },
  });
  return new WalletConnection(near, null);
}

export async function getWallet(): Promise<WalletConnection> {
  if (!walletPromise) {
    walletPromise = initWallet();
  }
  return walletPromise;
}
