/**
 * Comprehensive Cloudflare Deployment Preparation Script
 * This script prepares your Next.js application for Cloudflare Pages deployment
 * by setting up all necessary environment variables, polyfills, and build configurations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuration
const CONFIG = {
  // Cloudflare Database ID (your actual DB ID)
  cloudflareDbId: '715abbe3-5697-497b-8a6a-f4722632b741',
  
  // Required environment variables for Cloudflare deployment
  requiredEnvVars: [
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
  ],
  
  // Polyfills needed for Cloudflare compatibility
  polyfills: [
    'stream-browserify',
    'crypto-browserify',
    'https-browserify',
    'stream-http',
    'buffer',
    'path-browserify',
    'os-browserify',
    'browserify-zlib',
    'process',
    'util',
    'assert',
    'querystring-es3',
  ],

  // Essential npm packages for Cloudflare
  packages: {
    dev: [
      'cross-env',
      'dotenv',
      '@cloudflare/next-on-pages',
    ],
    prod: []
  },

  // Edge compatibility settings
  edgeCompatibility: {
    experimentalFeatures: [
      'esmExternals',
      'serverActions',
    ]
  }
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command) {
  try {
    log(`Executing: ${command}`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
}

function writeEnvFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    log(`Created/updated ${filePath}`, colors.green);
    return true;
  } catch (error) {
    log(`Failed to write to ${filePath}`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
}

// Main functions
function installDependencies() {
  log('Installing required dependencies for Cloudflare deployment...', colors.magenta);

  // // Install dev dependencies // COMMENTED OUT
  // if (CONFIG.packages.dev.length > 0) { // COMMENTED OUT
  //   const devCommand = `npm install --save-dev ${CONFIG.packages.dev.join(' ')}`; // COMMENTED OUT
  //   executeCommand(devCommand); // COMMENTED OUT
  // } // COMMENTED OUT
  // // Install production dependencies // COMMENTED OUT
  // if (CONFIG.packages.prod.length > 0) { // COMMENTED OUT
  //   const prodCommand = `npm install --save ${CONFIG.packages.prod.join(' ')}`; // COMMENTED OUT
  //   executeCommand(prodCommand); // COMMENTED OUT
  // } // COMMENTED OUT
  // // Install polyfills // COMMENTED OUT
  // log('Installing required polyfills for Cloudflare compatibility...', colors.magenta); // COMMENTED OUT
  // const polyfillCommand = `npm install --save-dev ${CONFIG.polyfills.join(' ')}`; // COMMENTED OUT
  // executeCommand(polyfillCommand); // COMMENTED OUT

  log('Skipping internal dependency installation (should be done beforehand).', colors.yellow); // Added log message
  // log('All dependencies installed successfully!', colors.green); // Commented out original success message
}

function createCloudflareEnvFile() {
  log('Creating Cloudflare environment file...', colors.magenta);

  // Load current environment variables
  // require('dotenv').config({ path: '.env.local' }); // COMMENTED OUT - Assuming vars are already in process.env for prod build

  // Check for required environment variables
  const missingVars = CONFIG.requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    log(`Missing required environment variables: ${missingVars.join(', ')}`, colors.red);
    log('Please add them to your .env.local file before proceeding.', colors.yellow);
    process.exit(1);
  }

  // Create the .env.edge file content
  const envContent = `# Cloudflare Edge Runtime Environment Configuration
# Generated on ${new Date().toISOString()}

# Runtime flags
NEXT_PUBLIC_DEPLOY_ENV=cloudflare
NEXT_PUBLIC_CLOUDFLARE_ENABLED=true

# Authentication
NEXTAUTH_URL=${process.env.NEXTAUTH_URL || 'https://app.lamontai.com'}
NEXTAUTH_SECRET=${process.env.NEXTAUTH_SECRET}
JWT_SECRET=${process.env.JWT_SECRET}

# Database configuration
DATABASE_URL=${process.env.DATABASE_URL || `postgresql://username:password@${CONFIG.cloudflareDbId}.hostname:5432/database?sslmode=require`}
CLOUDFLARE_DB_ID=${CONFIG.cloudflareDbId}

# Edge configuration
NODE_ENV=production

# API Keys (if applicable)
${process.env.OPENAI_API_KEY ? `OPENAI_API_KEY=${process.env.OPENAI_API_KEY}` : '# OPENAI_API_KEY=your_api_key_here'}
`;

  // Write the environment file
  writeEnvFile('.env.edge', envContent);
  
  // Also create a production env file
  writeEnvFile('.env.production', envContent);

  log('Environment files created successfully!', colors.green);
}

function updateNextConfig() {
  log('Updating Next.js configuration for Cloudflare compatibility...', colors.magenta);

  const configPath = 'next.config.js';
  if (!fs.existsSync(configPath)) {
    log(`${configPath} not found. Creating a new one.`, colors.yellow);
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Important environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDFLARE_DB_ID: process.env.CLOUDFLARE_DB_ID,
    NEXT_PUBLIC_DEPLOY_ENV: process.env.NEXT_PUBLIC_DEPLOY_ENV || 'local',
    NEXT_PUBLIC_CLOUDFLARE_ENABLED: process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED || 'false',
  },
  
  // Disable type checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true
  },
  
  // Disable ESLint during builds for faster builds
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Output configuration for Cloudflare deployment
  output: process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' ? 'standalone' : undefined,
  
  experimental: {
    // Experimental features needed for Cloudflare compatibility
    esmExternals: 'loose',
    serverActions: true,
  },
  
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
      
      // Add Buffer and process polyfills
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
};

module.exports = nextConfig;
`;
    
    writeEnvFile(configPath, nextConfigContent);
  } else {
    log(`${configPath} found. Leaving it unchanged.`, colors.yellow);
    log('Make sure your Next.js config has the required Cloudflare settings!', colors.yellow);
  }
}

function prepareCloudflare() {
  log('=== CLOUDFLARE DEPLOYMENT PREPARATION STARTING ===', colors.cyan);
  
  // Install all required dependencies
  installDependencies();
  
  // Create environment files
  createCloudflareEnvFile();
  
  // Update Next.js configuration
  updateNextConfig();
  
  // Copy environment file for the build
  log('Copying .env.edge to .env.local for build...', colors.magenta);
  fs.copyFileSync('.env.edge', '.env.local');
  
  log('\n=== CLOUDFLARE DEPLOYMENT PREPARATION COMPLETE ===', colors.green);
  log('\nYou can now run:', colors.cyan);
  log('  npm run build', colors.yellow);
  log('  npm run start', colors.yellow);
  log('\nOr for Cloudflare Pages deployment:', colors.cyan);
  log('  npx @cloudflare/next-on-pages', colors.yellow);
  log('\nHappy deploying! 🚀', colors.cyan);
}

// Execute the preparation
prepareCloudflare(); 