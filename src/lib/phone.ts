/*
 * Ghana phone helpers for WhatsApp deep links.
 * Local SIM format (0XX XXX XXXX) must become international (233XXXXXXXXX) for wa.me.
 */
export function toGhanaIntl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  let n = digits
  if (n.startsWith('+')) n = n.slice(1)
  if (n.startsWith('00233')) n = n.slice(2)
  if (n.startsWith('233')) return n.length >= 12 ? n : null
  if (n.startsWith('0')) return '233' + n.slice(1)
  return null
}

export function whatsappLink(
  phone: string | null | undefined,
  message: string
): string | null {
  const intl = toGhanaIntl(phone)
  if (!intl) return null
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}
