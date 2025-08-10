// lib/ws.js
// WebSocket bridge to backend service

const WS_URL = globalThis.AURORA_WS_URL || 'wss://api.auroraapp.dev/ws';

/**
 * Create a WebSocket connection to the backend.
 *
 * @param {string} token Authentication token retrieved from your backend's
 * login flow. Obtain the token via a secure HTTP request and store it
 * (e.g. in extension storage) before calling this function.
 * @returns {WebSocket | null} Active WebSocket or null if connection fails.
 */
export function connect(token){
  if (!token) {
    console.error('Cannot connect: auth token is missing');
    return null;
  }
  try {
    return new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
  } catch (e) {
    console.warn('WS connect failed', e);
    return null;
  }
}
