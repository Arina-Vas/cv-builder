import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.magnific.com', pathname: '/free-vector/**' },
    ],
  },
};

export default nextConfig;
