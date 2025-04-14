/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // External packages to transpile
  transpilePackages: ['lucide-react', 'bcryptjs', '@prisma/client'],
  
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
  
  // Disable type checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true
  },
  
  // Disable ESLint during builds for faster builds
  eslint: {
    ignoreDuringBuilds: true
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
  },
  
  // Specify output directory for production build
  distDir: '.next',
  
  experimental: {
    // Experimental hooks
    instrumentationHook: true,
    // WebAssembly support
    esmExternals: 'loose',
  },
  
  // Configure header security policies
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
  
  // Output configuration for Cloudflare deployment
  output: process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' ? 'standalone' : undefined,
  
  // Webpack configuration for Cloudflare compatibility
  webpack: (config, { isServer, dev }) => {
    // Polyfill Node.js modules for Cloudflare
    if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        querystring: require.resolve('querystring-es3'),
        fs: false,
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        zlib: require.resolve('browserify-zlib'),
        assert: require.resolve('assert/'),
      };
      
      // Import webpack instead of using config.constructor.ProvidePlugin
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    return config;
  },
}

module.exports = nextConfig;

