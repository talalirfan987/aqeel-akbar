const hits = new Map<string, number[]>();

/** Simple in-memory sliding-window rate limiter. Not for multi-instance production use. */
export function isRateLimited(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}
