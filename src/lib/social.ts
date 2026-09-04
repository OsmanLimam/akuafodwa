/*
 * ─────────────────────────────────────────────────────────────────────────
 *  AKUAFODWA SOCIAL LINKS — THE ONLY FILE YOU NEED TO EDIT
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  ✏️  WHATSAPP NUMBER — two ways to set it:
 *
 *      1) BEST: set the environment variable NEXT_PUBLIC_MARKET_WHATSAPP in
 *         Vercel (Project → Settings → Environment Variables) to your number
 *         in international format — country code 233, drop the leading 0:
 *           Ghana local:  0244 123 456   →   set:  233244123456
 *         Then redeploy (Deployments → ⋯ → Redeploy).
 *
 *      2) Or simply replace the fallback string on line 30 below and push.
 *
 *      Until a real number is set, the WhatsApp chat button is HIDDEN
 *      automatically (so visitors never message a dead number). Sharing a
 *      listing to WhatsApp keeps working — it opens the buyer's own WhatsApp
 *      and lets them pick any chat.
 *
 *  ✏️  SOCIAL PAGES: when you create the Facebook / Instagram / YouTube /
 *      TikTok / X pages, paste the real links below (handles below are
 *      placeholders following the standard username pattern).
 * ─────────────────────────────────────────────────────────────────────────
 */

export const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_MARKET_WHATSAPP || "233244000000").replace(/[^0-9]/g, "")

/** True only when a real (non-placeholder) market number is configured. */
export const WHATSAPP_CHAT_ENABLED = WHATSAPP_NUMBER !== "233244000000"

export const WHATSAPP_WELCOME =
  "Hello AkuafoDwa! 👋 I saw your market online and I have a question.";

export const SOCIAL_PROFILES = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/akuafodwa", // ⚠️ EDIT when your page is live
    color: "#1877F2",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/akuafodwa", // ⚠️ EDIT when your page is live
    color: "#DD2A7B",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@akuafodwa", // ⚠️ EDIT — Shorts live here too
    color: "#FF0000",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@akuafodwa", // ⚠️ EDIT when your page is live
    color: "#111111",
  },
  {
    name: "X (Twitter)",
    href: "https://x.com/akuafodwa", // ⚠️ EDIT when your page is live
    color: "#111111",
  },
] as const;
