import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy /api/* calls to the Express backend during development.
    // In production, set NEXT_PUBLIC_API_URL to the deployed backend URL instead.
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;