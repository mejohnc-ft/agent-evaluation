import { describe, expect, it, vi } from "vitest";
import { PRICE_REDACTION, publishedAmounts, redactPrices, redactPricesTransform } from "./price-guard";

const KB = "Hospitality: $420,000 Saved Annually. Real Estate: $136,000 revenue increase per Field Specialist.";
const allowed = publishedAmounts(KB);

async function streamThrough(chunks: string[], onRedact = vi.fn()) {
  const transform = redactPricesTransform(allowed, onRedact)({ tools: {}, stopStream: () => {} } as never);
  const writer = transform.writable.getWriter();
  const out: string[] = [];
  const reading = (async () => {
    const reader = transform.readable.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      if (value.type === "text-delta") out.push(value.text);
    }
  })();
  for (const text of chunks) await writer.write({ type: "text-delta", id: "t", text } as never);
  await writer.write({ type: "text-end", id: "t" } as never);
  await writer.close();
  await reading;
  return { text: out.join(""), onRedact };
}

describe("price-guard", () => {
  it("collects the currency amounts the knowledge base publishes", () => {
    expect([...allowed].sort()).toEqual(["$136,000", "$420,000"]);
  });

  it("keeps published amounts", () => {
    expect(redactPrices("One client saved $420,000 a year.", allowed).text).toBe("One client saved $420,000 a year.");
  });

  it("redacts invented prices in every common form", () => {
    for (const price of ["$25,000", "$25k", "$1.5M", "$40 thousand", "£2,000", "€900", "25,000 USD", "5000 dollars"]) {
      const { text, count } = redactPrices(`It costs ${price} to start.`, allowed);
      expect(text, price).toBe(`It costs ${PRICE_REDACTION} to start.`);
      expect(count).toBe(1);
    }
  });

  it("leaves plain numbers, days and percentages alone", () => {
    const text = "It takes 45 days, saves 220 hours and cuts time by 60%.";
    expect(redactPrices(text, allowed).text).toBe(text);
  });

  it("catches a price split across stream chunks and reports it", async () => {
    const { text, onRedact } = await streamThrough(["Usually between $2", "5,0", "00 and ", "$40,000 depending on size."]);
    expect(text).toBe(`Usually between ${PRICE_REDACTION} and ${PRICE_REDACTION} depending on size.`);
    expect(onRedact).toHaveBeenCalledWith(2);
  });

  it("catches an amount whose unit arrives in the next chunk", async () => {
    const { text } = await streamThrough(["Roughly 25,000 ", "dollars per month."]);
    expect(text).toBe(`Roughly ${PRICE_REDACTION} per month.`);
  });

  it("streams published amounts unchanged and reports nothing", async () => {
    const { text, onRedact } = await streamThrough(["Saved $420", ",000 annually."]);
    expect(text).toBe("Saved $420,000 annually.");
    expect(onRedact).not.toHaveBeenCalled();
  });
});
