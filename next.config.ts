import type { NextConfig } from 'next';

const localAllowedOrigins = [
  'localhost:3000',
  '127.0.0.1:3000',
  'localhost:1242',
  '127.0.0.1:1242',
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io', pathname: '/**' },
      { protocol: 'https', hostname: '0iezqxcrij.ufs.sh', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: localAllowedOrigins },
  },
  serverExternalPackages: ['pdfkit'],
};

export default nextConfig;
