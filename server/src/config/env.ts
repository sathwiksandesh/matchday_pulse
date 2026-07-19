import { z } from "zod";

/**
 * All process.env access in the codebase goes through this module. Validating
 * once at startup means a misconfigured deployment fails immediately and
 * loudly, instead of surfacing as a confusing runtime error later.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LLM_PROVIDER: z.enum(["mock", "gemini", "anthropic"]).default("mock"),
  GEMINI_API_KEY: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  LLM_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(15),
  /** When set, the server also serves the built client from this directory (see Dockerfile). */
  STATIC_CLIENT_DIR: z.string().optional().default("")
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(source: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    // Fail closed: an app that can't validate its own configuration should
    // not start serving traffic.
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  if (parsed.data.LLM_PROVIDER === "gemini" && !parsed.data.GEMINI_API_KEY) {
    throw new Error("LLM_PROVIDER=gemini requires GEMINI_API_KEY to be set");
  }
  if (parsed.data.LLM_PROVIDER === "anthropic" && !parsed.data.ANTHROPIC_API_KEY) {
    throw new Error("LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set");
  }
  return parsed.data;
}

export const env = loadEnv(process.env);
export { loadEnv };
