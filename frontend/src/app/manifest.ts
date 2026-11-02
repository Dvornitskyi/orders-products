import type { MetadataRoute } from 'next';

// Манифест PWA: по нему браузер понимает, как «установить» сайт как приложение.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Orders & Products',
    short_name: 'Orders',
    start_url: '/orders',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0d6efd',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  };
}
