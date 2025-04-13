/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // Remove the suppressHydrationWarnings option as it's not supported
  },
  // Include CSS configuration
  webpack(config) {
    return config;
  },
  // Add public file serving config
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Configure distDir
  distDir: '.next',
};

export default nextConfig;
