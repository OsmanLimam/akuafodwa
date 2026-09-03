# AkuafoDwa — Ghana's Farmers Market Online

_"Akuafo" means farmers, "Dwa" means market._ A mobile-first agricultural marketplace where farmers and traders list produce and livestock, buyers make offers, both sides negotiate, and deals close directly — no middlemen taking a cut.

- **Market**: browse real stalls across all 16 regions of Ghana, GH₵ pricing
- **Deals**: offer → counter → agreed, then phone numbers unlock and you finish on WhatsApp or a call
- **Trust**: Ghana Card identity verification, seller's own photos, no platform fee
- **Extras**: PWA install, dark mode, English + Twi (owner-transcribed), WhatsApp share cards, web push notifications, admin dashboard with premium (pinned) listings

## Stack

Next.js 16 (App Router, hash-routed SPA) · TypeScript · Tailwind CSS 4 + shadcn/ui · Prisma ORM · PostgreSQL (Neon in production) · web-push (VAPID)

## Run locally

```bash
bun install                # also runs prisma generate (postinstall)
cp .env.example .env       # point DATABASE_URL at any Postgres (local or Neon)
bun run db:push            # create the full schema
bun prisma/seed.ts         # optional: load the demo market (10 users, 36 listings)
bun run dev                # http://localhost:3000
```

### Demo accounts (from the seed)

| Email | Password | Role |
|---|---|---|
| akua@akuafodwa.com | demo1234 | Farmer (verified) |
| kwame@akuafodwa.com | demo1234 | Buyer |
| admin@akuafodwa.com | admin1234 | Admin |

> Change or remove these before launching to real users.

## Environment variables

| Name | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@ep-xxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true` | Postgres connection string (Neon pooled) |
| `VAPID_PUBLIC_KEY` | for push | base64url string | Web push public key |
| `VAPID_PRIVATE_KEY` | for push | base64url string | Web push private key |
| `VAPID_SUBJECT` | no | `mailto:support@akuafodwa.com` | Push contact header |
| `SEED_DEMO` | no | `1` | On a **fresh (empty)** database, auto-create the schema and load the demo market once |

Generate push keys with: `bunx web-push generate-vapid-keys`

## Deploying

The app self-bootstraps: on any **empty** database the schema is created on first request, and with `SEED_DEMO=1` the demo market loads automatically (guarded by a Postgres advisory lock, so concurrent cold starts can't double-seed). No migration step needed.

### Vercel + Neon Postgres (recommended)

1. Create a free project at [neon.tech](https://neon.tech) and copy the **pooled** connection string.
2. Push this repo to GitHub, then "Add New Project" on Vercel and import it.
3. Framework preset: **Next.js** (auto-detected). Build/install commands: defaults.
4. Environment variables:
   - `DATABASE_URL` = your Neon pooled string, with `&pgbouncer=true` appended
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — your generated values
   - `SEED_DEMO` = `1` (loads the demo market once, on the first visit)
5. Deploy.

Data persists in Neon across deploys and cold starts — this is the real-database setup.

### Any Node host

```bash
bun run build
NODE_ENV=production DATABASE_URL="postgresql://..." bun .next/standalone/server.js
```

## Schema changes

After editing `prisma/schema.prisma`:

```bash
bun run db:push              # apply to your dev database
bun scripts/gen-schema-sql.ts  # regenerate src/lib/schema-sql.ts (idempotent cold-start DDL)
```

## Owner rules (by design)

- **No password reset** — keep it simple, deal in person
- **Premium/pinned listings are admin-only** — granted from the Admin dashboard, never bought
- **Listings never expire**
- **One Postgres database holds everything** (Neon project `akuafodwa`)
- New marketing sections are English-only; all Twi strings come from the owner's own transcriptions
