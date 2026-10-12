import type { Store } from "@/lib/store/types";
import { block, pass, type GuardResult } from "./messages";

export const RATE_LIMIT = 20;
export const RATE_WINDOW_SECONDS = 600;

// Fails open: a store outage must not take the bot down. The spend breaker still caps cost.
export async function checkRateLimit(
  store: Pick<Store, "bumpRate">,
  clientKey: string,
  log: (...args: unknown[]) => void = console.error,
): Promise<GuardResult> {
  try {
    const count = await store.bumpRate(clientKey, RATE_WINDOW_SECONDS);
    return count > RATE_LIMIT ? block("rate_limited") : pass;
  } catch (error) {
    log("rate-limit: store error, failing open", error);
    return pass;
  }
}
