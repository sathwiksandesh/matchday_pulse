import { Router } from "express";
import { z } from "zod";
import { llmClient } from "../../lib/llm/index.js";
import { llmRateLimit } from "../../middleware/rate-limit.js";
import { validateQuery } from "../../middleware/validate.js";
import { OperationsService } from "./service.js";

const venueQuerySchema = z.object({ venueId: z.string().min(1).max(64) }).strict();

export const operationsRouter = Router();
const service = new OperationsService(llmClient);

operationsRouter.get("/snapshot", validateQuery(venueQuerySchema), (req, res) => {
  const { venueId } = req.query as { venueId: string };
  res.json(service.getSnapshot(venueId));
});

operationsRouter.post("/briefing", llmRateLimit, validateQuery(venueQuerySchema), async (req, res, next) => {
  try {
    const { venueId } = req.query as { venueId: string };
    const briefing = await service.generateBriefing(venueId);
    res.json(briefing);
  } catch (error) {
    next(error);
  }
});
