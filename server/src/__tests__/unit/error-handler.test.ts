import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";
import { errorHandler } from "../../middleware/error-handler.js";
import { AppError } from "../../lib/app-error.js";

function fakeRes() {
  const res: { statusCode?: number; body?: unknown; status: (c: number) => typeof res; json: (b: unknown) => typeof res } = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };
  return res;
}

const fakeReq = { path: "/api/test" } as never;

describe("errorHandler", () => {
  it("maps a ZodError to a sanitized 400 VALIDATION_ERROR", () => {
    const res = fakeRes();
    let zodError: ZodError;
    try {
      z.object({ a: z.string() }).parse({ a: 1 });
      throw new Error("unreachable");
    } catch (e) {
      zodError = e as ZodError;
    }
    errorHandler(zodError, fakeReq, res as never, vi.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ code: "VALIDATION_ERROR", message: expect.any(String) });
  });

  it("maps an AppError to its own status code and code, never leaking internals", () => {
    const res = fakeRes();
    errorHandler(AppError.tooManyRequests("slow down"), fakeReq, res as never, vi.fn());
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ code: "RATE_LIMITED", message: "slow down" });
  });

  it("maps an unrecognized error to a generic sanitized 500", () => {
    const res = fakeRes();
    errorHandler(new Error("some internal detail with a stack trace"), fakeReq, res as never, vi.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ code: "INTERNAL_ERROR", message: expect.any(String) });
    expect(JSON.stringify(res.body)).not.toContain("stack trace");
  });
});
