import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85
      },
      exclude: [
        "**/index.ts",
        "**/dist/**",
        "**/vitest.config.ts",
        "src/lib/llm/gemini-provider.ts",
        "src/lib/llm/anthropic-provider.ts"
      ]
    }
  }
});
