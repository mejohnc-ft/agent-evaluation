import { describe, expect, it } from "vitest";
import { needsGapFallback } from "./gap-fallback";

describe("needsGapFallback", () => {
  it("fires when the reply says it lacks the information and no gap was logged", () => {
    expect(needsGapFallback("I don't have information on whether Cadre offers training in Tokyo.", [])).toBe(true);
    expect(needsGapFallback("I don’t have any details about a Tokyo office.", ["get_page_link"])).toBe(true);
    expect(needsGapFallback("That isn't covered in what I know about Cadre.", [])).toBe(true);
  });

  it("stays quiet when the model already logged the gap", () => {
    expect(needsGapFallback("I don't have information on that.", ["log_knowledge_gap"])).toBe(false);
  });

  it("stays quiet for answered questions", () => {
    expect(needsGapFallback("Cadre works with private equity firms and their portfolio companies.", [])).toBe(false);
    expect(needsGapFallback("I can't give you a score; take the AI Maturity Index yourself.", [])).toBe(false);
  });
});
