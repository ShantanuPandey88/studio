
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Make environment variables available on the server.
  // This is the crucial part that pipes the App Hosting secret
  // into the server-side runtime environment.
  serverRuntimeConfig: {
    SERVICE_ACCOUNT_JSON: process.env.SERVICE_ACCOUNT_JSON,
  },
};

export default nextConfig;
