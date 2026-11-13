import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/** Uploaded files (avatars) come from the bucket at this URL: S3_PUBLIC_URL of the backend */
const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL
  ? new URL(process.env.NEXT_PUBLIC_STORAGE_URL)
  : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.magnific.com', pathname: '/free-vector/**' },
      ...(storageUrl
        ? [
            {
              protocol: storageUrl.protocol === 'https:' ? ('https' as const) : ('http' as const),
              hostname: storageUrl.hostname,
              port: storageUrl.port,
              pathname: `${storageUrl.pathname.replace(/\/$/, '')}/**`,
            },
          ]
        : []),
    ],
    // Locally the bucket is MinIO on localhost; Next refuses to optimize images from local IPs otherwise
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
