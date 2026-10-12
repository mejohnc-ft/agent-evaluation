import { block, pass, type GuardResult } from "./messages";

type Verify = () => Promise<{ isBot: boolean }>;

// Vercel BotID classifies the request invisibly (no CAPTCHA). Fails open like the rate limit: a
// BotID outage must not take the bot down, and the rate limit and spend breaker still apply.
export async function checkBot(verify: Verify, log: (...args: unknown[]) => void = console.error): Promise<GuardResult> {
  try {
    return (await verify()).isBot ? block("bot_blocked") : pass;
  } catch (error) {
    log("bot-check: verification error, failing open", error);
    return pass;
  }
}
