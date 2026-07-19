import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  app = createApp();
});

describe("GET /api/health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /.well-known/security.txt", () => {
  it("serves an RFC 9116 disclosure file", async () => {
    const res = await request(app).get("/.well-known/security.txt");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Contact:");
  });
});

describe("venue routes", () => {
  it("lists venues", async () => {
    const res = await request(app).get("/api/venues");
    expect(res.status).toBe(200);
    expect(res.body.venues.length).toBeGreaterThan(0);
  });

  it("returns a single venue by id", async () => {
    const res = await request(app).get("/api/venues/azteca");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Estadio Azteca");
  });

  it("returns 404 for an unknown venue", async () => {
    const res = await request(app).get("/api/venues/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("filters facilities by category", async () => {
    const res = await request(app).get("/api/venues/azteca/facilities").query({ category: "elevator" });
    expect(res.status).toBe(200);
    expect(res.body.facilities.every((f: { category: string }) => f.category === "elevator")).toBe(true);
  });

  it("rejects an invalid facility category", async () => {
    const res = await request(app).get("/api/venues/azteca/facilities").query({ category: "not-a-category" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/assistant/ask", () => {
  it("returns a grounded answer for a valid request", async () => {
    const res = await request(app)
      .post("/api/assistant/ask")
      .send({ venueId: "azteca", question: "Which gate serves section 205?", language: "en" });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBeTruthy();
    expect(res.body.groundedOnFacts).toBeGreaterThan(0);
  });

  it("rejects a payload with an unknown field", async () => {
    const res = await request(app)
      .post("/api/assistant/ask")
      .send({ venueId: "azteca", question: "hi", language: "en", extra: "nope" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a question over the length cap", async () => {
    const res = await request(app)
      .post("/api/assistant/ask")
      .send({ venueId: "azteca", question: "a".repeat(500), language: "en" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown venue", async () => {
    const res = await request(app).post("/api/assistant/ask").send({ venueId: "nowhere", question: "hi", language: "en" });
    expect(res.status).toBe(404);
  });
});

describe("operations routes", () => {
  it("returns a live snapshot with classified zones", async () => {
    const res = await request(app).get("/api/operations/snapshot").query({ venueId: "azteca" });
    expect(res.status).toBe(200);
    expect(res.body.zones.length).toBeGreaterThan(0);
    for (const zone of res.body.zones) {
      expect(["comfortable", "busy", "critical"]).toContain(zone.status);
    }
  });

  it("generates an AI briefing", async () => {
    const res = await request(app).post("/api/operations/briefing").query({ venueId: "azteca" });
    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeTruthy();
  });
});

describe("POST /api/volunteer/dispatch", () => {
  it("returns a structured, validated dispatch brief", async () => {
    const res = await request(app).post("/api/volunteer/dispatch").send({
      venueId: "azteca",
      reporterRole: "steward",
      zoneId: "z-east",
      message: "Large queue building at east entry, need extra stewards",
      targetLanguage: "en"
    });
    expect(res.status).toBe(200);
    expect(["low", "medium", "high"]).toContain(res.body.priority);
    expect(res.body.translatedMessage).toBeTruthy();
    expect(res.body.suggestedAction).toBeTruthy();
  });

  it("rejects an invalid reporterRole", async () => {
    const res = await request(app).post("/api/volunteer/dispatch").send({
      venueId: "azteca",
      reporterRole: "unknown_role",
      zoneId: "z-east",
      message: "test",
      targetLanguage: "en"
    });
    expect(res.status).toBe(400);
  });
});

describe("unknown routes and rate limiting", () => {
  it("returns 404 with a sanitized body for an unmatched route", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND", message: expect.any(String) });
  });

  it("sets standard rate limit headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers).toHaveProperty("ratelimit-limit");
  });
});
