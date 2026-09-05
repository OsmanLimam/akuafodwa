// Persistent fixed-window rate limiter backed by the "RateLimit" Postgres table.
//
// The Task 26 audit flagged the previous in-memory limiter as per-lambda-instance
// (weak on Vercel serverless, where every cold instance had its own counters).
// This version keeps counters in Postgres (Neon) and increments them with a
// single atomic INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING statement, so
// the limit holds no matter which serverless instance handles the request.
//
// FAIL OPEN: if the database call fails for any reason (a Neon hiccup must never
// lock buyers out of the market), we log once and allow the request.
import { db } from '@/lib/db'

export interface RateLimitResult {
  ok: boolean
  retryAfterSeconds: number
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // Best-effort hygiene: on ~5% of calls, delete rows whose window ended more
  // than 24h ago. The longest window used anywhere is 24h, so no live window is
  // ever removed. Fire-and-forget: never awaited, errors are caught and logged.
  if (Math.random() < 0.05) {
    void db
      .$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < ${new Date(Date.now() - 24 * 60 * 60 * 1000)}`
      .catch((e: unknown) => console.error('rate-limit cleanup error', e))
  }

  try {
    // Fixed window: window expiry is decided inside the SQL. The stored
    // windowStart is compared against a computed cutoff timestamp parameter
    // (now - windowMs). Expired/absent window -> count=1, windowStart=NOW();
    // live window -> count=count+1. All values are bound parameters — the
    // statement never string-interpolates user input.
    const cutoff = new Date(Date.now() - windowMs)
    const rows = await db.$queryRaw<Array<{ count: number; windowStart: Date }>>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."windowStart" > ${cutoff}
                       THEN "RateLimit"."count" + 1 ELSE 1 END,
        "windowStart" = CASE WHEN "RateLimit"."windowStart" > ${cutoff}
                             THEN "RateLimit"."windowStart" ELSE NOW() END
      RETURNING "count", "windowStart"
    `
    const row = rows[0]
    if (!row) {
      // Unreachable (INSERT ... RETURNING always yields one row) — fail open.
      return { ok: true, retryAfterSeconds: 0 }
    }
    const count = Number(row.count)
    if (count <= limit) {
      return { ok: true, retryAfterSeconds: 0 }
    }
    // Fixed window: time left until windowStart + windowMs (at least 1s).
    const windowEndMs = new Date(row.windowStart).getTime() + windowMs
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - Date.now()) / 1000)),
    }
  } catch (e) {
    // FAIL OPEN: a Neon hiccup must never lock buyers out of the market.
    console.error('rate-limit error (failing open)', e)
    return { ok: true, retryAfterSeconds: 0 }
  }
}

// Best-effort client IP from proxy headers (the app sits behind a gateway).
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
