import withBundleAnalyzer from '@next/bundle-analyzer';

// Адрес бэкенда для запросов ВНУТРИ сервера Next (SSR и прокси /api).
const API = process.env.INTERNAL_API_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
// `npm run analyze` строит карту бандла (.next/analyze/*.html)
const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === '1' });

export default withAnalyzer({
  // Минимальный образ для Docker (включается только в Dockerfile; локально `npm start` работает без этого)
  ...(process.env.STANDALONE === '1' ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Браузер ходит на /api/... своего же домена, Next перенаправляет на бэкенд (без проблем с CORS)
  async rewrites() { return [{ source: '/api/:path*', destination: `${API}/api/:path*` }]; }
});
