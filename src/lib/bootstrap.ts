import { db } from './db'
import { SCHEMA_SQL } from './schema-sql'

/**
 * Cold-start bootstrap for fresh hosts.
 *
 * Local dev already has db/custom.db with every table, so the DDL below is a
 * no-op there. On an ephemeral host (Vercel serverless) the SQLite file starts
 * empty: this builds the full schema once per server process, and optionally
 * loads the demo market when SEED_DEMO=1 and the database is still empty.
 *
 * Memoized: the first caller awaits the work, everyone after gets the resolved
 * promise in microseconds. On failure the memo is cleared so the next request
 * can retry.
 */

let readyPromise: Promise<void> | null = null

async function prepare(): Promise<void> {
  // 1. Idempotent DDL. The generated script is CREATE TABLE/INDEX IF NOT EXISTS
  //    only, so splitting on ';' is safe (no string literals contain one).
  const statements = SCHEMA_SQL.split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    await db.$executeRawUnsafe(statement)
  }

  // 2. Optional demo market, only when opted in AND the database is brand new.
  if (process.env.SEED_DEMO === '1') {
    const users = await db.user.count()
    if (users === 0) {
      const { runSeed } = await import('../../prisma/seed-data')
      await runSeed(db)
    }
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
