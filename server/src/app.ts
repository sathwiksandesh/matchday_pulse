import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { assistantRouter } from "./features/assistant/routes.js";
import { operationsRouter } from "./features/operations/routes.js";
import { venueRouter } from "./features/venue/routes.js";
import { volunteerRouter } from "./features/volunteer/routes.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { generalRateLimit } from "./middleware/rate-limit.js";
import { applySecurity } from "./middleware/security.js";
import { applyStaticClient } from "./middleware/static-client.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  applySecurity(app);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"]
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "100kb" }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== "test" }));
  app.use(generalRateLimit);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: process.env.npm_package_version ?? "1.0.0" });
  });

  app.use("/api/venues", venueRouter);
  app.use("/api/assistant", assistantRouter);
  app.use("/api/operations", operationsRouter);
  app.use("/api/volunteer", volunteerRouter);

  if (env.STATIC_CLIENT_DIR) applyStaticClient(app, env.STATIC_CLIENT_DIR);

  app.use((req, res) => {
    res.status(404).json({ code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
