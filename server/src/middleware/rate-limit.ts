import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/** General limiter applied to the whole API. */
export const generalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." }
});

/**
 * Stricter limiter for the two routes that call the LLM provider, since
 * those are the only ones with a real per-call cost and latency budget.
 */
export const llmRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.LLM_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many AI requests. Please wait a moment and try again." }
});
