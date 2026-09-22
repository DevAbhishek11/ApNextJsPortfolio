// ---------------------------------------------------------------------------
// Simple in-memory sliding-window rate limiter (per server process).
// Used for /api/auth/login and /api/contact. Per-process is acceptable for a
// single Node instance (the documented deployment target); swap for Redis if
// you ever scale horizontally.
// ---------------------------------------------------------------------------

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

function prune(hits: number[], windowMs: number, now: number): number[] {
  return hits.filter((t) => now - t < windowMs);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = prune(bucket.hits, windowMs, now);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

// Periodically drop stale buckets so memory doesn't grow unbounded.
let lastSweep = 0;
export function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = prune(bucket.hits, windowMs, now);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}
