import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Stable identity for installers/store packaging (PWABuilder, Play Store).
    id: '/',
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
    screenshots: [
      {
        src: '/screenshots/app-mobile.jpg',
        sizes: '589x1278',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: "Fresh on the market — produce from all 16 regions of Ghana",
      },
      {
        src: '/screenshots/app-desktop.jpg',
        sizes: '1152x720',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'AkuafoDwa market on desktop',
      },
    ],
  }
}
