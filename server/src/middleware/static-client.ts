import type { Express } from "express";
import express from "express";
import path from "node:path";
import fs from "node:fs";

/**
 * Serves the built React client from the same process as the API when
 * STATIC_CLIENT_DIR is set (used by the Dockerfile's single-container
 * deploy). Content-hashed assets get a long cache lifetime; index.html is
 * never cached so a new deploy is picked up immediately. Any non-API path
 * that doesn't match a static file falls back to index.html so client-side
 * routing (React Router) works on a hard refresh.
 */
export function applyStaticClient(app: Express, dir: string): void {
  if (!dir || !fs.existsSync(dir)) return;

  app.use(
    express.static(dir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    })
  );

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(dir, "index.html"));
  });
}
