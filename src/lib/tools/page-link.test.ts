import { describe, expect, it } from "vitest";
import { linkFor } from "../links";
import { pageSummary } from "../page-summary";
import { getPageLink, PAGE_LABELS } from "./page-link";

describe("get_page_link", () => {
  it("every label resolves to an allowed link in links.md", () => {
    for (const label of PAGE_LABELS) expect(linkFor(label).url).toMatch(/^https:\/\/(cadre\.ai|portal\.gocadre\.ai)\//);
  });

  it("returns the link and a one-line description from the knowledge base", async () => {
    const out = await getPageLink.execute!({ page: "Real Estate" }, { toolCallId: "t", messages: [] } as never);
    expect(out).toMatchObject({ label: "Real Estate", url: "https://cadre.ai/industries/real-estate" });
    expect((out as { description: string }).description).toMatch(/^Close more deals faster/);
  });

  it("gives every page a description from the knowledge base", () => {
    for (const label of PAGE_LABELS) expect(pageSummary(linkFor(label).url), label).not.toBe("");
  });

  it("rejects labels outside the list", () => {
    expect(getPageLink.inputSchema).toBeDefined();
    expect(() => linkFor("Pricing")).toThrow();
  });
});
