export type Scenario = {
  id: string;
  tier: number;
  input: string;
  expect?: string[];
  reject?: string[];
  reject_claim?: string[];
};

// Hostnames or links in model text. Emails (hello@gocadre.ai) are allowed.
const URL_PATTERN = /https?:\/\/|www\.|(?<![@\w.-])(?:[a-z0-9-]+\.)+(?:ai|com|io|net|org|co)\b/i;
const CURRENCY_PATTERN = /[$€£]\s?\d[\d,.]*|\b\d[\d,.]*\s?(usd|dollars|eur|gbp)\b/gi;
const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?/g;
const NEGATION = /\b(not|no|never|don't|doesn't|isn't|can't|cannot|haven't|unconfirmed|only)\b/i;

const numbersIn = (text: string) => (text.match(NUMBER_PATTERN) ?? []).map((n) => n.replace(/,/g, ""));

// Returns one message per failed check; empty means pass.
export function check(scenario: Scenario, reply: string, knowledgeText: string): string[] {
  const failures: string[] = [];
  if (!reply.trim()) return ["empty reply"];

  const url = reply.match(URL_PATTERN);
  if (url) failures.push(`no_url: found "${url[0]}"`);
  // Published results such as "$420,000 Saved Annually" are allowed; any other amount is invented.
  const currency = (reply.match(CURRENCY_PATTERN) ?? []).filter((amount) => !knowledgeText.includes(amount.trim()));
  if (currency.length) failures.push(`no_currency: found "${currency[0]}"`);

  const grounded = new Set([...numbersIn(knowledgeText), ...numbersIn(scenario.input)]);
  const ungrounded = numbersIn(reply).filter((n) => !grounded.has(n));
  if (ungrounded.length) failures.push(`numbers_grounded: ${[...new Set(ungrounded)].join(", ")} not in knowledge/`);

  for (const pattern of scenario.expect ?? []) {
    if (!new RegExp(pattern, "i").test(reply)) failures.push(`expect /${pattern}/`);
  }
  for (const pattern of scenario.reject ?? []) {
    const hit = reply.match(new RegExp(pattern, "i"));
    if (hit) failures.push(`reject /${pattern}/: found "${hit[0]}"`);
  }
  for (const pattern of scenario.reject_claim ?? []) {
    const claim = reply.split(/(?<=[.!?])\s+|\n+/).find((s) => new RegExp(pattern, "i").test(s) && !NEGATION.test(s));
    if (claim) failures.push(`reject_claim /${pattern}/: "${claim.trim()}"`);
  }
  return failures;
}
