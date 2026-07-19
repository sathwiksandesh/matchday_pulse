import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/app-error.js";
import { logger } from "../lib/logger.js";

/**
 * The single place errors become HTTP responses. Every response body is the
 * same sanitized shape `{ code, message }` — no stack traces, no upstream
 * provider payloads, no internal paths ever reach the client. Full detail is
 * logged server-side only.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    logger.warn({ path: req.path, issues: err.issues }, "Validation error");
    res.status(400).json({ code: "VALIDATION_ERROR", message: "Request payload failed validation." });
    return;
  }

  if (err instanceof AppError) {
    const log = err.isOperational ? logger.warn.bind(logger) : logger.error.bind(logger);
    log({ path: req.path, code: err.code, err: err.isOperational ? undefined : err }, err.message);
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }

  logger.error({ path: req.path, err }, "Unhandled error");
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." });
};
