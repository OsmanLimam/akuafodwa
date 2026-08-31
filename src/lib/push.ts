import webpush from 'web-push'
import { db } from '@/lib/db'

/**
 * Web push (VAPID) delivery for AkuafoDwa.
 * Fires-and-forgets notifications to every device a user has enabled.
 * Never throws: push is a bonus on top of the in-app offer inbox.
 */

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@akuafodwa.com',
    publicKey,
    privateKey
  )
  configured = true
  return true
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null
}

export interface PushPayload {
  title: string
  body: string
  /** In-app destination, e.g. `/#/inbox/<threadId>` or `/#/listing/<id>` */
  url?: string
  /** Notifications with the same tag replace each other instead of piling up */
  tag?: string
}

/**
 * Send a push to every device of one user. Silent best-effort:
 * - 404/410 (subscription expired or revoked) prune the row so we don't retry dead endpoints.
 * - Any other failure is logged and skipped.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return
  let subs
  try {
    subs = await db.pushSubscription.findMany({ where: { userId } })
  } catch {
    return
  }
  if (subs.length === 0) return

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 3600 * 24 }
        )
        await db.pushSubscription
          .update({ where: { id: sub.id }, data: { lastUsedAt: new Date() } })
          .catch(() => undefined)
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined)
        } else {
          console.error('push send failed', status, (err as Error).message)
        }
      }
    })
  )
}

/** One-line summary of an optional chat message, safe for a notification body. */
export function preview(text: string | null | undefined, max = 90): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}
