import pino from "pino";

const level = import.meta.env.VITE_LOG_LEVEL ?? (import.meta.env.PROD ? "error" : "debug");
const enabled = import.meta.env.VITE_LOG_ENABLED !== "false";
const endpoint = import.meta.env.VITE_LOG_ENDPOINT;

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
