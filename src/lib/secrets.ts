import { timingSafeEqual } from "node:crypto";

// Constant-time comparison of a presented value with a configured secret.
// An unset or empty secret never matches, so a missing env var can't open a door.
export function matchesSecret(presented: string | null, secret: string | undefined): boolean {
  if (!secret || !presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
