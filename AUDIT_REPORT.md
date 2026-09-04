
---

# REMEDIATION LOG — updates shipped after this audit

**Commit `a8cf75c` (live on production):**
- **C1 FIXED (code half):** demo-account chips render only in local development; production demo-seeding requires explicit `ALLOW_DEMO_SEED=1`; seeded admin password no longer hardcoded. **Verified live:** login dialog contains no demo text or chips.
- **C1 credential rotation:** the live admin password was rotated off `admin1234` via the new password-change API (old password confirmed rejected with 401). **Founder action pending:** paste one UPDATE in the Neon SQL console to set the new hash (steps provided in chat), then set a personal password via Profile → Change my password.
- **C3 FIXED:** logo 685→15 KB, favicon 187→3 KB (cache-busted to `?v=4`), icon-192 107→20 KB, icon-512 685→81 KB, maskable 416→74 KB, apple-touch 58→14 KB, hero 253→152 KB, unused 2.1 MB `logo-raw.png` deleted. First-visit image cost: ~1.21 MB → ~0.19 MB. **Verified live** (byte sizes from production).
- **C4 FIXED (gating):** WhatsApp chat number reads `NEXT_PUBLIC_MARKET_WHATSAPP`; while unset, the chat FAB and footer WhatsApp button hide automatically (dead number unreachable). **Verified live:** FAB hidden, footer shows 5 icons. **Founder action pending:** set the env var + redeploy to bring the button back with the real number.
- **C5 FIXED:** public `/api/listings` no longer returns `seller.phone`. **Verified live.**
- **C6 FIXED:** `/api/admin/users` returns only id/name/email/role/identityStatus/createdAt/listing-count. **Verified live.**
- **BONUS (partial C7):** password change shipped (Profile → Change my password; server verifies current password, revokes other sessions, audit-logged). Full email-based reset remains on the roadmap.
- **Still open:** C2 (report listing), full C7 (email reset), Medium/Low batches.
