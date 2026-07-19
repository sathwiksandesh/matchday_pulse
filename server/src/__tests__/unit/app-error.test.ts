import { describe, expect, it } from "vitest";
import { AppError } from "../../lib/app-error.js";

describe("AppError", () => {
  it("badRequest produces a 400 operational error", () => {
    const err = AppError.badRequest("bad input");
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err.code).toBe("BAD_REQUEST");
  });

  it("notFound produces a 404 operational error", () => {
    const err = AppError.notFound("missing");
    expect(err.statusCode).toBe(404);
  });

  it("tooManyRequests produces a 429 operational error", () => {
    const err = AppError.tooManyRequests("slow down");
    expect(err.statusCode).toBe(429);
  });

  it("upstream produces a non-operational 502 error", () => {
    const err = AppError.upstream("provider down");
    expect(err.statusCode).toBe(502);
    expect(err.isOperational).toBe(false);
  });

  it("internal produces a non-operational 500 error", () => {
    const err = AppError.internal("bug");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it("is an instance of Error with the right name", () => {
    const err = AppError.badRequest("x");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AppError");
  });
});
