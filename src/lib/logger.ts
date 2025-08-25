import pino from "pino";

// Allow string-first logging with additional args without requiring
// placeholder parsing in the type system.
interface LogFn {
  (msg: string, ...args: unknown[]): void;
  (obj: unknown, msg?: string, ...args: unknown[]): void;
}

export interface Logger extends pino.Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
}

const level = import.meta.env.VITE_LOG_LEVEL ?? (import.meta.env.PROD ? "error" : "debug");
const enabled = import.meta.env.VITE_LOG_ENABLED !== "false";
const endpoint = import.meta.env.VITE_LOG_ENDPOINT;

const baseLogger = pino({
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

export default baseLogger as Logger;
