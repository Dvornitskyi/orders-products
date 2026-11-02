import withBundleAnalyzer from '@next/bundle-analyzer';

const API = process.env.INTERNAL_API_URL ?? 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === '1',
});

export default withAnalyzer({
  ...(process.env.STANDALONE === '1' ? { output: 'standalone' } : {}),
  reactStrictMode: true,

  experimental: { staleTimes: { dynamic: 0 } },
  eslint: { ignoreDuringBuilds: true },

  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
});
