import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io', pathname: '/**' }, // Uploadthing
      { protocol: 'https', hostname: '0iezqxcrij.ufs.sh', pathname: '/**' }, // Uploadthing assigned host
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' }, // Google OAuth avatars
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

export default nextConfig;
