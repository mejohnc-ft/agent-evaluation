import type { Criterion } from "./judge";

export type Turn = { role: "user" | "assistant"; content: string };
export type ToolCall = { name: string; input: unknown };

export type Scenario = {
  id: string;
  tier: number;
  input?: string;
  messages?: Turn[];
  expect?: string[];
  reject?: string[];
  reject_claim?: string[];
  judge?: Criterion[];
  tools?: {
    called?: string[];
    not_called?: string[];
    args?: Record<string, Record<string, string>>;
  };
};

// Hostnames or links in model text. Emails (hello@gocadre.ai) are allowed.
const URL_PATTERN = /https?:\/\/|www\.|(?<![@\w.-])(?:[a-z0-9-]+\.)+(?:ai|com|io|net|org|co)\b/i;
const CURRENCY_PATTERN = /[$€£]\s?\d[\d,.]*|\b\d[\d,.]*\s?(usd|dollars|eur|gbp)\b/gi;
const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?/g;
const NEGATION = /\b(not|no|never|don't|doesn't|isn't|can't|cannot|haven't|unconfirmed|only)\b/i;

const numbersIn = (text: string) => (text.match(NUMBER_PATTERN) ?? []).map((n) => n.replace(/,/g, ""));

// The conversation sent to the model: `messages:` as written, or `input:` as one user turn.
export function conversation(scenario: Scenario): Turn[] {
  if (scenario.messages) return scenario.messages;
  if (scenario.input === undefined) throw new Error(`scenario ${scenario.id} needs input: or messages:`);
  return [{ role: "user", content: scenario.input }];
}

// Returns one message per failed check; empty means pass.
export function check(scenario: Scenario, rawReply: string, toolCalls: ToolCall[], steps: { text: number; mixed: number }, knowledgeText: string): string[] {
  // Typographic quotes (can’t, “x”) must not slip past patterns written with straight ones.
  const reply = rawReply.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const failures = checkTools(scenario, toolCalls);
  if (!reply.trim()) return ["empty reply", ...failures];
  // Text before and after a tool call shows the visitor two answers in one bubble.
  if (steps.text > 1) failures.push(`single_reply: text in ${steps.text} steps`);
  // A reply that points to a card must have asked for one; otherwise the visitor looks for a button that isn't there.
  const cardTools = ["get_booking_link", "show_contact_form"];
  if (/\b(the|this) (contact )?(button|form) (below|opens)\b|\bbelow is the (button|form)\b|\buse the button\b/i.test(reply) && !toolCalls.some((c) => cardTools.includes(c.name))) {
    failures.push("phantom_card: mentions a button or form but no card tool was called");
  }
  // Text written in the same step as the handoff call can't know whether the row was written.
  if (steps.mixed) failures.push("handoff_claim_after_result: text written alongside request_human_followup");

  const url = reply.match(URL_PATTERN);
  if (url) failures.push(`no_url: found "${url[0]}"`);
  // Published results such as "$420,000 Saved Annually" are allowed; any other amount is invented.
  const currency = (reply.match(CURRENCY_PATTERN) ?? []).filter((amount) => !knowledgeText.includes(amount.trim()));
  if (currency.length) failures.push(`no_currency: found "${currency[0]}"`);

  const userText = conversation(scenario).filter((t) => t.role === "user").map((t) => t.content).join("\n");
  const grounded = new Set([...numbersIn(knowledgeText), ...numbersIn(userText)]);
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

function checkTools(scenario: Scenario, toolCalls: ToolCall[]): string[] {
  const failures: string[] = [];
  const names = new Set(toolCalls.map((c) => c.name));
  for (const name of scenario.tools?.called ?? []) {
    if (!names.has(name)) failures.push(`tools.called: ${name} was not called`);
  }
  for (const name of scenario.tools?.not_called ?? []) {
    if (names.has(name)) failures.push(`tools.not_called: ${name} was called`);
  }
  for (const [name, fields] of Object.entries(scenario.tools?.args ?? {})) {
    const inputs = toolCalls.filter((c) => c.name === name).map((c) => (c.input ?? {}) as Record<string, unknown>);
    for (const [field, pattern] of Object.entries(fields)) {
      const regex = new RegExp(pattern, "i");
      if (!inputs.some((input) => regex.test(String(input[field])))) {
        failures.push(`tools.args: no ${name} call with ${field} matching /${pattern}/`);
      }
    }
  }
  return failures;
}
