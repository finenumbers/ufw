import { assertRateLimit } from "@/lib/rate-limit";

export const OPERATION_REPEAT_LIMIT_MS = 30_000;

/** Fixed 30s cooldown for UFW refresh and port scan repeat actions. Not env-configurable. */

export function retryAfterSeconds(retryAfterMs: number): number {
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

export function createRateLimitedFailure(retryAfterMs: number) {
  return {
    success: false as const,
    rateLimited: true as const,
    retryAfterSeconds: retryAfterSeconds(retryAfterMs),
  };
}

export function checkOperationRateLimit(key: string) {
  return assertRateLimit(key, {
    limit: 1,
    windowMs: OPERATION_REPEAT_LIMIT_MS,
  });
}
