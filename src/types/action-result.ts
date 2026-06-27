export type RateLimitedActionFailure = {
  success: false;
  rateLimited: true;
  retryAfterSeconds: number;
};

export type ActionErrorResult = {
  success: false;
  error: string;
};

export type ActionFailureResult = RateLimitedActionFailure | ActionErrorResult;

export function isRateLimitedFailure(
  result: ActionFailureResult,
): result is RateLimitedActionFailure {
  return "rateLimited" in result && result.rateLimited === true;
}
