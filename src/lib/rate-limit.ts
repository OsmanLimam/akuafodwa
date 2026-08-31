// Simple in-memory sliding-window rate limiter.
// Suitable for a single-instance deployment; not a distributed solution.
type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()

// Periodically clean expired buckets to avoid unbounded growth.
let lastClean = Date.now()
function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastClean < 60_000) return
  lastClean = now
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs)
    if (bucket.hits.length === 0) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanup(windowMs)
  const now = Date.now()
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket)
    const oldest = bucket.hits[0]
    return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000) }
  }
  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true, retryAfterSeconds: 0 }
}

// Best-effort client IP from proxy headers (the app sits behind a gateway).
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
