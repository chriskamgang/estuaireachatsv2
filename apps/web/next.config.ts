import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ea/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
  async rewrites() {
    return [
      {
        source: '/callcenter/:path*',
        destination: 'http://127.0.0.1:3004/callcenter/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Pages HTML : pas de cache navigateur
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
