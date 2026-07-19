import { Router } from "express";
import { llmClient } from "../../lib/llm/index.js";
import { llmRateLimit } from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate.js";
import { dispatchRequestSchema } from "./schema.js";
import { VolunteerCopilotService } from "./service.js";

export const volunteerRouter = Router();
const service = new VolunteerCopilotService(llmClient);

volunteerRouter.post("/dispatch", llmRateLimit, validateBody(dispatchRequestSchema), async (req, res, next) => {
  try {
    const brief = await service.triage(req.body);
    res.json(brief);
  } catch (error) {
    next(error);
  }
});
