import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@wewatch/ir-schema', '@wewatch/shared-utils'],
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflarestorage.com' },
      // local dev placeholder
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
