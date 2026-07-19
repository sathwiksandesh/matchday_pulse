import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

/**
 * Validates and replaces `req.body` with the parsed, typed result of
 * `schema`. Unknown keys are rejected at the schema level (schemas use
 * `.strict()`), so payload smuggling is caught here rather than downstream.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Overwriting a getter-only property on newer Express typings requires
    // reassigning via defineProperty in some versions; direct assignment is
    // fine for the express@4 Request type used here.
    req.query = schema.parse(req.query) as unknown as Request["query"];
    next();
  };
}
