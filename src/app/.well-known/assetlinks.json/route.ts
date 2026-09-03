import { NextResponse } from 'next/server'

/**
 * Digital Asset Links statement list.
 *
 * This verifies the Android TWA (Trusted Web Activity) app to the website:
 * once Google Play signs the AkuafoDwa APK with a SHA-256 fingerprint listed
 * below, Chrome runs the app full-screen with no browser URL bar.
 * Play Console requires this file at https://<domain>/.well-known/assetlinks.json.
 *
 * Configure via env vars (no code change needed):
 *   TWA_PACKAGE_NAME        e.g. com.akuafodwa.app
 *   TWA_SHA256_FINGERPRINTS comma-separated SHA-256 certificate fingerprints
 *                           (upload key + Play App Signing key, if different)
 */

export const dynamic = 'force-dynamic'

export function GET() {
  const packageName = process.env.TWA_PACKAGE_NAME || 'com.akuafodwa.app'

  const fingerprints = (process.env.TWA_SHA256_FINGERPRINTS ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)

  // One statement per fingerprint; empty array when none configured yet
  // (Android treats a statement list without a matching fingerprint as
  // "no app verified", which is the honest state until the owner adds the
  // real signing fingerprint).
  const statements = fingerprints.map((fingerprint) => ({
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: [fingerprint],
    },
  }))

  return NextResponse.json(statements, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
