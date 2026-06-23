type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

function pruneBucket(bucket: Bucket, windowMs: number, now: number): void {
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);
}

export function assertRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  pruneBucket(bucket, options.windowMs, now);

  if (bucket.timestamps.length >= options.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, options.windowMs - (now - oldest)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: options.limit - bucket.timestamps.length,
    retryAfterMs: 0,
  };
}

export function getClientIp(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = headerStore.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
