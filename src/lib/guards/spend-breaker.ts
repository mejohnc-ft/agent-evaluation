import type { Store } from "@/lib/store/types";
import { block, pass, type GuardResult } from "./messages";

// Fails closed: if today's spend is unknown we cannot prove we are under the limit.
export async function checkSpend(
  store: Pick<Store, "spendTodayUsd">,
  limitUsd: number,
  log: (...args: unknown[]) => void = console.error,
): Promise<GuardResult> {
  try {
    return (await store.spendTodayUsd()) >= limitUsd ? block("spend_limit") : pass;
  } catch (error) {
    log("spend-breaker: store error, failing closed", error);
    return block("spend_limit");
  }
}
