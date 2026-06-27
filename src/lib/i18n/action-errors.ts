import type { ActionFailureResult } from "@/types/action-result";
import { isRateLimitedFailure } from "@/types/action-result";

type TranslateRateLimit = (key: "rateLimitRetry", values: { seconds: number }) => string;

export function resolveActionFailureMessage(
  result: ActionFailureResult,
  translate: TranslateRateLimit,
): string {
  if (isRateLimitedFailure(result)) {
    return translate("rateLimitRetry", { seconds: result.retryAfterSeconds });
  }

  return result.error;
}
