import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // For Cloudflare Pages with @cloudflare/next-on-pages
  // Static exports won't work with API routes, so we use edge runtime
};

export default nextConfig;
