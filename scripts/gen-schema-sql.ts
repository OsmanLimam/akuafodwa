/**
 * Regenerates src/lib/schema-sql.ts from prisma/schema.prisma.
 *
 * Run after editing the Prisma schema:
 *   bun scripts/gen-schema-sql.ts
 *
 * What it does:
 *  1. Runs `prisma migrate diff --from-empty --to-schema-datamodel` (offline)
 *     to get the plain Postgres DDL.
 *  2. Makes it idempotent so the app can run it on every cold start against a
 *     fresh database (e.g. a brand-new Neon project on Vercel):
 *       - CREATE TABLE / CREATE INDEX        -> IF NOT EXISTS
 *       - ALTER TABLE ... ADD CONSTRAINT     -> wrapped in a DO block that
 *         checks pg_constraint first (Postgres has no ADD CONSTRAINT IF NOT
 *         EXISTS, even in recent versions)
 *  3. Splits the script into individual statements, dollar-quote-aware (DO $$
 *     blocks contain semicolons and must not be split).
 *  4. Emits src/lib/schema-sql.ts with SCHEMA_STATEMENTS + SCHEMA_TABLES.
 *
 * src/lib/bootstrap.ts consumes those statements on cold start.
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')

const ddl = execSync(
  'bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
  { encoding: 'utf8', cwd: ROOT },
)

// --- 1. Make CREATEs idempotent -------------------------------------------
let sql = ddl
  .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
  .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
  .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "')

// --- 2. Wrap ADD CONSTRAINT in a guarded DO block --------------------------
sql = sql.replace(
  /ALTER TABLE ("[^"]+") ADD CONSTRAINT ("[^"]+") FOREIGN KEY[^;]*;/g,
  (full, table: string, name: string) => {
    const inner = full.replace(/;$/, '')
    return [
      'DO $$',
      'BEGIN',
      `    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ${name}) THEN`,
      `        ${inner};`,
      '    END IF;',
      'END $$;',
    ].join('\n')
  },
)

// --- 3. Drop pure comment lines --------------------------------------------
const lines = sql.split('\n').filter((l) => !l.trimStart().startsWith('--'))

// --- 4. Dollar-quote-aware statement split ---------------------------------
const statements: string[] = []
let buf: string[] = []
let inDollar = false
for (const line of lines) {
  buf.push(line)
  const dollars = line.match(/\$\$/g)
  if (dollars) for (let i = 0; i < dollars.length; i++) inDollar = !inDollar
  if (!inDollar && line.trimEnd().endsWith(';')) {
    statements.push(buf.join('\n').trim())
    buf = []
  }
}
const tail = buf.join('\n').trim()
if (tail) statements.push(tail)

// --- 5. Collect the table names (for the fast "schema exists?" check) ------
const tableNames = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS "([^"]+)"/g)].map((m) => m[1])

if (tableNames.length === 0) throw new Error('No CREATE TABLE found — diff output changed?')

// --- 6. Emit the TypeScript module ------------------------------------------
const header = `// AUTO-GENERATED from prisma/schema.prisma — do not edit by hand.
// Regenerate with: bun scripts/gen-schema-sql.ts
//
// Idempotent Postgres DDL. Lets a fresh host (e.g. a brand-new Neon database
// on Vercel) build the full schema on first use; running it again is a no-op.
// - Tables/indexes use IF NOT EXISTS.
// - Foreign keys are wrapped in DO blocks that check pg_constraint, because
//   Postgres has no ADD CONSTRAINT IF NOT EXISTS.
// Statements are pre-split (dollar-quote aware); src/lib/bootstrap.ts runs
// them one by one via $executeRawUnsafe.

export const SCHEMA_TABLES: string[] = [
${tableNames.map((t) => "  '" + t + "',").join('\n')}
]

export const SCHEMA_STATEMENTS: string[] = [
${statements.map((s) => '  `' + s + '`,').join('\n\n')}
]
`

writeFileSync(join(ROOT, 'src/lib/schema-sql.ts'), header)
console.log(
  `wrote src/lib/schema-sql.ts: ${statements.length} statements, ${tableNames.length} tables`,
)
