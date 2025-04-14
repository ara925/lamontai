/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure image optimization
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
    unoptimized: process.env.NODE_ENV === 'development',
    domains: [
      'images.unsplash.com', 
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
  },
  
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable response compression
  compress: true,
  
  experimental: {
    // Remove the suppressHydrationWarnings option as it's not supported
    serverActionsBodySizeLimit: '4mb',
    timeAllowance: 25*1000, // 25 seconds
  },
  
  // Include CSS configuration
  webpack(config) {
    return config;
  },
  
  // Add public file serving config
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Configure distDir
  distDir: '.next',
  
  // Configure environment variables to be available in the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  },
  
  // Disable type checking during production build for faster builds
  typescript: {
    // !! WARN !!
    // This setting is only for speeding up production builds, not recommended for development
    // It disables type checking during build
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // Configure headers for security
  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];
    
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },
  
  // Output standalone builds for containerization
  output: 'standalone',
};

export default nextConfig;
