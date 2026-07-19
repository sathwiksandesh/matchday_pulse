import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../src/lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(response: { ok: boolean; status: number; json: () => Promise<unknown> }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

describe("api client", () => {
  it("returns parsed JSON on a successful call", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ venues: [{ id: "azteca" }] }) });
    const result = await api.listVenues();
    expect(result.venues).toHaveLength(1);
  });

  it("throws an ApiError with the server's code and message on failure", async () => {
    mockFetch({ ok: false, status: 404, json: async () => ({ code: "NOT_FOUND", message: "Unknown venue" }) });
    await expect(api.listVenues()).rejects.toMatchObject({ status: 404, body: { code: "NOT_FOUND" } });
  });

  it("falls back to a generic error body when the error response isn't JSON", async () => {
    mockFetch({ ok: false, status: 500, json: async () => Promise.reject(new Error("not json")) });
    try {
      await api.listVenues();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).body.code).toBe("UNKNOWN_ERROR");
    }
  });
});
