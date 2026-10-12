import { describe, expect, it } from "vitest";
import { checkContactProvenance } from "./contact-provenance";

const visitor = ["Hi, I want to talk to sales", "Sure, it's Jo.Smith@Acme.co.uk, thanks"];

describe("contact-provenance", () => {
  it("accepts an email the visitor typed", () => {
    expect(checkContactProvenance("Jo.Smith@Acme.co.uk", visitor)).toEqual({ ok: true });
  });

  it("accepts a different case and surrounding spaces", () => {
    expect(checkContactProvenance("  jo.smith@acme.co.uk ", visitor)).toEqual({ ok: true });
  });

  it("rejects an email the visitor never typed", () => {
    expect(checkContactProvenance("sales@acme.co.uk", visitor)).toMatchObject({ ok: false, reason: "contact_unverified" });
  });

  it("rejects a corrected or completed address", () => {
    expect(checkContactProvenance("jo@acme.com", ["my email is jo@acme.co"])).toMatchObject({ ok: false });
  });

  it("rejects a prefix of a typed address", () => {
    expect(checkContactProvenance("jo@acme.co", ["my email is jo@acme.com"])).toMatchObject({ ok: false });
  });

  it("rejects when the visitor has typed no messages", () => {
    expect(checkContactProvenance("jo@acme.com", [])).toMatchObject({ ok: false });
  });

  it.each(["", "   "])("rejects a blank email %j", (email) => {
    expect(checkContactProvenance(email, ["jo@acme.com"])).toMatchObject({ ok: false });
  });

  it("tells the model to ask the visitor", () => {
    const result = checkContactProvenance("x@y.com", ["hello"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/type/i);
  });
});
