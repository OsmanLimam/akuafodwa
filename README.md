# AkuafoDwa — Ghana's Farmers Market Online

_"Akuafo" means farmers, "Dwa" means market._ A mobile-first agricultural marketplace where farmers and traders list produce and livestock, buyers make offers, both sides negotiate, and deals close directly — no middlemen taking a cut.

- **Market**: browse real stalls across all 16 regions of Ghana, GH₵ pricing
- **Deals**: offer → counter → agreed, then phone numbers unlock and you finish on WhatsApp or a call
- **Trust**: Ghana Card identity verification, seller's own photos, no platform fee
- **Extras**: PWA install, dark mode, English + Twi (owner-transcribed), WhatsApp share cards, web push notifications, admin dashboard with premium (pinned) listings

## Stack

Next.js 16 (App Router, hash-routed SPA) · TypeScript · Tailwind CSS 4 + shadcn/ui · Prisma ORM · SQLite (single file) · web-push (VAPID)

## Run locally

```bash
bun install                # also runs prisma generate (postinstall)
cp .env.example .env       # then adjust if needed
bun run db:push            # create db/custom.db with the full schema
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
| `DATABASE_URL` | yes | `file:/home/z/my-project/db/custom.db` | SQLite file location (the single source of truth) |
| `VAPID_PUBLIC_KEY` | for push | base64url string | Web push public key |
| `VAPID_PRIVATE_KEY` | for push | base64url string | Web push private key |
| `VAPID_SUBJECT` | no | `mailto:support@akuafodwa.com` | Push contact header |
| `SEED_DEMO` | no | `1` | On a **fresh** database, auto-create the schema and load the demo market |

Generate push keys with: `bunx web-push generate-vapid-keys`

## Deploying

The app self-bootstraps: on any fresh host the schema is created on first request, and with `SEED_DEMO=1` the demo market loads automatically. No migration step needed.

### Vercel (demo)

1. Push this repo to GitHub, then "Add New Project" on Vercel and import it.
2. Framework preset: **Next.js** (auto-detected). Build/install commands: defaults.
3. Environment variables:
   - `DATABASE_URL` = `file:/tmp/akuafo.db`
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — your generated values
   - `SEED_DEMO` = `1` (loads the demo market on cold start)
4. Deploy.

**Important**: Vercel's filesystem is ephemeral — the SQLite file lives in `/tmp`, so listings, users and deals **reset on every deploy/cold start**. Perfect for a live demo, not for real market data. For persistent data, deploy the same repo unchanged to any host with a persistent disk (Railway, Render, Fly.io, a small VPS) and point `DATABASE_URL` at a real path — the one-SQLite-file design carries over as-is.

### Any Node host

```bash
bun run build
NODE_ENV=production DATABASE_URL=file:/path/to/data/akuafo.db bun .next/standalone/server.js
```

## Owner rules (by design)

- **No password reset** — keep it simple, deal in person
- **Premium/pinned listings are admin-only** — granted from the Admin dashboard, never bought
- **Listings never expire**
- **One SQLite file holds everything** (`db/custom.db`)
- New marketing sections are English-only; all Twi strings come from the owner's own transcriptions
