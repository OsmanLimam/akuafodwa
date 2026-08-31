/**
 * AkuafoDwa seed CLI. Run with: bun prisma/seed.ts
 * The seed logic + data live in seed-data.ts so the server can reuse them
 * (src/lib/bootstrap.ts loads the demo market on fresh hosts with SEED_DEMO=1).
 */
import { PrismaClient } from '@prisma/client'
import { runSeed } from './seed-data'

const db = new PrismaClient()

runSeed(db)
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
