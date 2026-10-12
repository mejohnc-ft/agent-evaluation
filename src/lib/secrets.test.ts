import { describe, expect, it } from "vitest";
import { matchesSecret } from "./secrets";

describe("matchesSecret", () => {
  it("matches only the exact secret", () => {
    expect(matchesSecret("abc123", "abc123")).toBe(true);
    expect(matchesSecret("abc124", "abc123")).toBe(false);
    expect(matchesSecret("abc12", "abc123")).toBe(false);
  });

  it("never matches when the secret is unset or empty", () => {
    expect(matchesSecret("", "")).toBe(false);
    expect(matchesSecret("anything", undefined)).toBe(false);
    expect(matchesSecret(null, "abc123")).toBe(false);
  });
});
