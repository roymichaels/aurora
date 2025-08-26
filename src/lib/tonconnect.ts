import { TonConnectUI } from "@tonconnect/ui";

const ORIGIN = import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;

export const tonConnectUI = new TonConnectUI({
  manifestUrl: `${ORIGIN}/tonconnect-manifest.json`,
  restoreConnection: true,
});

