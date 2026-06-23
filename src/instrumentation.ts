export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is required in production. Generate with: openssl rand -base64 32",
    );
  }

  if (!process.env.APP_ENCRYPTION_KEY) {
    throw new Error(
      "APP_ENCRYPTION_KEY is required in production. Generate with: openssl rand -base64 32",
    );
  }

  const key = Buffer.from(process.env.APP_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must be a 32-byte base64-encoded key");
  }

  const { sweepStaleApplySessions } = await import("@/server/services/apply-maintenance");
  const swept = await sweepStaleApplySessions();
  if (swept > 0) {
    const { createChildLogger } = await import("@/lib/logger");
    createChildLogger("startup").warn({ swept }, "Marked stale apply sessions as failed");
  }
}
