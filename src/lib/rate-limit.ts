// Lightweight in-memory sliding-window limiter. Fine for a single-instance MVP.
// For multi-instance / scale, swap the Map for Upstash Redis (REST) — same shape.

const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max = Number(process.env.TUTOR_RATE_LIMIT_PER_MIN) || 8) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= max) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - hits[0])) / 1000);
    return { ok: false as const, retryAfter };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true as const, remaining: max - hits.length };
}
