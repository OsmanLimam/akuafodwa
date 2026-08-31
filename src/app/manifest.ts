import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AkuafoDwa: Ghana's Farmers Market Online",
    short_name: 'AkuafoDwa',
    description:
      "Ghana's agricultural marketplace. List produce and livestock, make offers, negotiate and deal directly. Free to join.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fffdf5',
    theme_color: '#1b5e20',
    categories: ['business', 'shopping', 'food'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
