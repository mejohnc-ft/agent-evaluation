import { describe, expect, it } from "vitest";
import { parseSource } from "./knowledge-sources";

const file = `---
source: https://cadre.ai/strategy
verified: 2026-10-12
services: [strategy]
---
# AI Strategy

- A line with # inside.
`;

describe("parseSource", () => {
  it("reads source, verified and the first heading", () => {
    expect(parseSource("strategy.md", file)).toEqual({
      file: "strategy.md",
      title: "AI Strategy",
      url: "https://cadre.ai/strategy",
      verified: "2026-10-12",
    });
  });

  it("skips files without frontmatter, a source or a heading", () => {
    expect(parseSource("a.md", "# Title only")).toBeNull();
    expect(parseSource("b.md", file.replace(/^source:.*$/m, ""))).toBeNull();
    expect(parseSource("c.md", file.replace("# AI Strategy", "AI Strategy"))).toBeNull();
  });
});
