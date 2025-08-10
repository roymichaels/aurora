import pino from "pino";

const level = globalThis.LOG_LEVEL || (process?.env?.NODE_ENV === "production" ? "error" : "debug");
const enabled = globalThis.LOG_ENABLED !== false;
const endpoint = globalThis.LOG_ENDPOINT;

const logger = pino({
  level,
  enabled,
  browser: {
    asObject: true,
    write: endpoint
      ? (o) => {
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(o),
          }).catch(() => {});
        }
      : undefined,
  },
});

export default logger;
