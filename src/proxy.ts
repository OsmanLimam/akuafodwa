import { NextResponse, type NextRequest } from 'next/server'

/**
 * Share-link support: WhatsApp, Telegram and other crawlers fetch
 * `/?listing=<id>` and never run the client app, so the listing id is
 * forwarded to the server via a request header. layout.tsx generateMetadata
 * reads it and emits Open Graph tags (title, price, real photo) so the link
 * unfurls as a rich WhatsApp share card.
 */
export default function proxy(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get('listing')
  if (!listingId) return NextResponse.next()

  const headers = new Headers(req.headers)
  headers.set('x-share-listing', listingId.slice(0, 64))
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/'],
}
