import { db } from './db'
import { SCHEMA_STATEMENTS, SCHEMA_TABLES } from './schema-sql'

/**
 * Cold-start bootstrap for fresh hosts.
 *
 * Local dev and any already-initialised database skip straight through the
 * cheap schema check below. On a brand-new database (e.g. a fresh Neon project
 * behind a Vercel deployment) this builds the full schema once, and optionally
 * loads the demo market when SEED_DEMO=1 and the database is still empty.
 *
 * Memoized: the first caller awaits the work, everyone after gets the resolved
 * promise in microseconds. On failure the memo is cleared so the next request
 * can retry.
 */

let readyPromise: Promise<void> | null = null

async function prepare(): Promise<void> {
  // 1. Schema. Warm starts pay one round-trip: count the expected tables and
  //    skip the DDL entirely when they are all there. A fresh database pays
  //    the full idempotent DDL (safe to race: every statement is guarded).
  const expected = SCHEMA_TABLES.map((t) => `'${t}'`).join(', ')
  const rows = await db.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN (${expected})`,
  )
  if ((rows[0]?.n ?? 0) < SCHEMA_TABLES.length) {
    for (const statement of SCHEMA_STATEMENTS) {
      await db.$executeRawUnsafe(statement)
    }
  }

  // 2. Optional demo market, only when opted in AND the database is brand new.
  // SECURITY: demo data (including its accounts) is never seeded into a
  // production deployment — only in local development. To deliberately seed
  // demo content into a fresh production database, set ALLOW_DEMO_SEED=1.
  const seedAllowed =
    process.env.SEED_DEMO === '1' &&
    (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_SEED === '1')
  if (seedAllowed) {
    await db.$transaction(
      async (tx) => {
        // Serialize racing cold starts (two serverless instances can boot at
        // the same moment): the first transaction to take the advisory lock
        // seeds; the others re-check afterwards and find users already there.
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(723018273)')
        const users = await tx.user.count()
        if (users === 0) {
          const { runSeed } = await import('../../prisma/seed-data')
          await runSeed(tx)
        }
      },
      // The seed inserts a few hundred rows over the network to the database;
      // give the interactive transaction room to breathe.
      { timeout: 55000, maxWait: 15000 },
    )
  }
}

export function ensureDatabaseReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = prepare().catch((err) => {
      readyPromise = null
      throw err
    })
  }
  return readyPromise
}
