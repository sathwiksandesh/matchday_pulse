import request from "supertest";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyStaticClient } from "../../middleware/static-client.js";

let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "static-client-"));
  fs.writeFileSync(path.join(dir, "index.html"), "<html><body>root</body></html>");
  fs.mkdirSync(path.join(dir, "assets"));
  fs.writeFileSync(path.join(dir, "assets", "app.js"), "console.log('hi')");
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("applyStaticClient", () => {
  it("does nothing when the directory does not exist", async () => {
    const app = express();
    applyStaticClient(app, "/nonexistent/path");
    app.use((_req, res) => res.status(404).send("no static client"));
    const res = await request(app).get("/");
    expect(res.text).toBe("no static client");
  });

  it("serves a hashed asset with a long-lived cache header", async () => {
    const app = express();
    applyStaticClient(app, dir);
    const res = await request(app).get("/assets/app.js");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("immutable");
  });

  it("falls back to index.html for a non-API client route", async () => {
    const app = express();
    applyStaticClient(app, dir);
    const res = await request(app).get("/assistant");
    expect(res.status).toBe(200);
    expect(res.text).toContain("root");
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  it("does not intercept /api routes", async () => {
    const app = express();
    applyStaticClient(app, dir);
    app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
    const res = await request(app).get("/api/health");
    expect(res.body).toEqual({ status: "ok" });
  });
});
