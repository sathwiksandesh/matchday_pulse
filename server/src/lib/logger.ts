import pino from "pino";
import { env } from "../config/env.js";

/**
 * Structured JSON logs (severity-tagged) to stdout. In production these are
 * collected by the platform's log pipeline; in development pino keeps plain
 * JSON since it's cheap and avoids an extra dependency on a pretty-printer.
 */
export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  base: { service: "matchday-pulse-server" },
  timestamp: pino.stdTimeFunctions.isoTime
});
