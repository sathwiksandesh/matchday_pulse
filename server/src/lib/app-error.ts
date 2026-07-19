/**
 * A single, typed error shape used across the app. The error handler
 * middleware maps every thrown error to a sanitized `{ code, message }`
 * envelope so internal details (stack traces, upstream provider errors)
 * never leak to a client.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  /** True for errors safe to log at `warn` (client mistakes) vs `error` (our bugs / upstream failures). */
  readonly isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, code = "BAD_REQUEST"): AppError {
    return new AppError(400, code, message);
  }

  static notFound(message: string, code = "NOT_FOUND"): AppError {
    return new AppError(404, code, message);
  }

  static tooManyRequests(message: string, code = "RATE_LIMITED"): AppError {
    return new AppError(429, code, message);
  }

  static upstream(message: string, code = "UPSTREAM_ERROR"): AppError {
    return new AppError(502, code, message, false);
  }

  static internal(message: string, code = "INTERNAL_ERROR"): AppError {
    return new AppError(500, code, message, false);
  }
}
