/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Fix issues with dependencies that use Node.js APIs not available in Edge runtime
  transpilePackages: [
    'winston', 
    'winston-daily-rotate-file',
    'ioredis',
    'bcryptjs'
  ],
  
  // Optimize image handling
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Handle output for optimal deployments
  output: 'standalone',
  
  // Configure webpack to handle packages with dependencies on Node.js APIs
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include certain server-only packages in client bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 