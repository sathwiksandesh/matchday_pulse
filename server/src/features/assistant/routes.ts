import { Router } from "express";
import { llmClient } from "../../lib/llm/index.js";
import { llmRateLimit } from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate.js";
import { assistantRequestSchema } from "./schema.js";
import { AssistantService } from "./service.js";

export const assistantRouter = Router();
const service = new AssistantService(llmClient);

assistantRouter.post("/ask", llmRateLimit, validateBody(assistantRequestSchema), async (req, res, next) => {
  try {
    const result = await service.ask(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
