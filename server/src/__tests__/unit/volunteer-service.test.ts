import { describe, expect, it } from "vitest";
import { parseBrief } from "../../features/volunteer/service.js";
import { AppError } from "../../lib/app-error.js";

describe("parseBrief", () => {
  it("parses a well-formed JSON response", () => {
    const raw = JSON.stringify({ priority: "high", translatedMessage: "Medical needed at Gate 4", suggestedAction: "Dispatch medic" });
    const brief = parseBrief(raw);
    expect(brief.priority).toBe("high");
    expect(brief.translatedMessage).toContain("Gate 4");
  });

  it("strips markdown code fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({ priority: "low", translatedMessage: "ok", suggestedAction: "none" }) + "\n```";
    const brief = parseBrief(raw);
    expect(brief.priority).toBe("low");
  });

  it("throws an AppError with 502 status on invalid JSON", () => {
    expect(() => parseBrief("not json at all")).toThrow(AppError);
    try {
      parseBrief("not json at all");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(502);
    }
  });

  it("throws an AppError when JSON is valid but fails schema validation", () => {
    const raw = JSON.stringify({ priority: "urgent", translatedMessage: "ok" });
    expect(() => parseBrief(raw)).toThrow(AppError);
  });
});
