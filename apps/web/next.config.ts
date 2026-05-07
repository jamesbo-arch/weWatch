import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@wewatch/ir-schema', '@wewatch/shared-utils'],
};

export default nextConfig;
