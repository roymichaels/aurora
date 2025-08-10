// lib/ws.js
// Placeholder WS bridge to app (device token TBD)
import logger from "./logger.js";

export function connect(token){
  try {
    const ws = new WebSocket(`wss://app.yourdomain/ws?token=${encodeURIComponent(token)}`);
    return ws;
  } catch (e) {
    logger.warn('WS connect failed', e);
    return null;
  }
}
