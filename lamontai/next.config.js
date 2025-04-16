/** @type {import('next').NextConfig} */
const webpack = require('webpack');

// Check if we're running in a CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // External packages to transpile - include packages that need to be transpiled
  transpilePackages: [],
  
  // Important environment variables
  env: {
    REDIS_URL: process.env.REDIS_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_DEPLOY_ENV: process.env.NEXT_PUBLIC_DEPLOY_ENV || 'local',
  },
  
  // Set the output for Cloudflare Pages compatibility
  output: 'standalone',
  
  // Experimental features
  experimental: {
    // Required for certain features
    esmExternals: true,
    // Enable instrumentation (performance monitoring)
    instrumentationHook: true,
    // Adjust as needed for your project
    serverComponentsExternalPackages: ['winston', 'bcryptjs', 'ioredis', 'winston-daily-rotate-file'],
  },
  
  // Handle specific route exclusions for Cloudflare
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Don't include certain server-only packages in client bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // For crypto, use the crypto-browserify polyfill instead of setting to false
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        util: require.resolve('util/'),
        url: false,
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
      };

      // Add polyfills for Node.js globals
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    
    return config;
  },
  
  // Enable TypeScript type checking in build
  typescript: {
    // Always check TypeScript during builds
    ignoreBuildErrors: false,
  },
  
  // Enable ESLint checks in build
  eslint: {
    // Always check ESLint during builds
    ignoreDuringBuilds: false,
  },
  
  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Setup redirects
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },
  
  // Override routes with custom configurations
  async rewrites() {
    const isCloudflare = process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare';
    
    if (isCloudflare) {
      return [
        // Prevent problematic routes from being accessed directly
        {
          source: '/api/auth/:path*',
          destination: '/api/auth-cloudflare/:path*',
        },
      ];
    }
    
    return [];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Configure Cloudflare Images support
    loader: process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' ? 'custom' : undefined,
    loaderFile: process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' ? './src/lib/cloudflare-image-loader.js' : undefined,
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable the Edge runtime only for specific pages that support it
  // This is needed to support Cloudflare Pages
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  
  // Optimize for CI environments - prevent hanging builds
  ...(isCI && {
    // Reduce build concurrency in CI to prevent OOM issues
    compiler: {
      // Reduce memory usage in CI environments
      styledComponents: false, // If you're not using styled-components
    },
    experimental: {
      // Prevent hanging builds due to large dependencies in CI
      craCompat: false,
      turbotrace: false, // Disable turbotrace in CI as it can sometimes hang
    }
  })
}

// Check for Edge Runtime configuration
if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare') {
  // Additional Cloudflare-specific settings
  nextConfig.experimental = {
    ...nextConfig.experimental,
  };
}

module.exports = nextConfig;

