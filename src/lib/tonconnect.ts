import { TonConnectUI } from "@tonconnect/ui";

declare global {
  interface Window {
    __tcui?: TonConnectUI;
  }
}

const ORIGIN = import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;
const MANIFEST_URL = `${ORIGIN}/tonconnect-manifest.json`;

export function getTonConnectUI(): TonConnectUI {
  if (!window.__tcui) {
    window.__tcui = new TonConnectUI({
      manifestUrl: MANIFEST_URL,
      restoreConnection: true,
    });
  }
  return window.__tcui;
}

export async function connectTonkeeper() {
  const ui = getTonConnectUI();
  try {
    await ui.connectWallet();
  } catch (e) {
    console.error("[TON] connect failed:", e);
  }
}

