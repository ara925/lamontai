/**
 * Build troubleshooting and optimization script
 * Run this before or during a build to fix common issues
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

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command) {
  try {
    log(`Executing: ${command}`, colors.blue);
    const result = execSync(command, { stdio: 'pipe' });
    return result.toString().trim();
  } catch (error) {
    log(`Command failed: ${command}`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return null;
  }
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, colors.green);
  }
}

// Check if running in CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Main functions
function cleanBuildCache() {
  log('Cleaning build cache...', colors.magenta);
  
  // Clean .next directory
  if (fs.existsSync('.next')) {
    try {
      fs.rmSync('.next', { recursive: true, force: true });
      log('Removed .next directory', colors.green);
    } catch (error) {
      log(`Error removing .next directory: ${error.message}`, colors.red);
    }
  }
  
  // Clean node_modules/.cache
  const cacheDir = path.join('node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      log('Removed node_modules/.cache directory', colors.green);
    } catch (error) {
      log(`Error removing cache directory: ${error.message}`, colors.red);
    }
  }
}

function fixPrismaIssues() {
  log('Fixing Prisma client issues...', colors.magenta);
  
  // Generate Prisma client
  try {
    executeCommand('npx prisma generate');
    log('Generated Prisma client', colors.green);
  } catch (error) {
    log(`Error generating Prisma client: ${error.message}`, colors.red);
  }
  
  // Copy Prisma Schema
  const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  const targetDir = path.join(process.cwd(), '.next', 'server');
  
  if (fs.existsSync(prismaDir)) {
    ensureDirExists(targetDir);
    
    // Find and copy engine files
    const files = fs.readdirSync(prismaDir);
    let enginesCopied = 0;
    
    for (const file of files) {
      if (file.includes('query-engine') || file.includes('schema.prisma')) {
        const source = path.join(prismaDir, file);
        const target = path.join(targetDir, file);
        
        try {
          fs.copyFileSync(source, target);
          log(`Copied ${file} to ${targetDir}`, colors.green);
          enginesCopied++;
        } catch (error) {
          log(`Error copying ${file}: ${error.message}`, colors.red);
        }
      }
    }
    
    log(`Copied ${enginesCopied} Prisma files to .next/server`, colors.green);
  } else {
    log('Prisma client directory not found', colors.yellow);
  }
}

function installPolyfills() {
  log('Installing required polyfills...', colors.magenta);
  
  const polyfills = [
    'crypto-browserify',
    'stream-browserify',
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
  ];
  
  try {
    executeCommand(`npm install --no-save ${polyfills.join(' ')}`);
    log('Installed polyfills successfully', colors.green);
  } catch (error) {
    log(`Error installing polyfills: ${error.message}`, colors.red);
  }
}

function optimizeForBuild() {
  log('Optimizing environment for build...', colors.magenta);
  
  // Increase Node.js memory limit
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  log('Increased Node.js memory limit to 4GB', colors.green);
  
  // Set build optimization flags
  if (isCI) {
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    log('Disabled Next.js telemetry for faster builds', colors.green);
  }
  
  // Check available system resources
  try {
    const osInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };
    
    if (process.platform !== 'win32') {
      // These commands won't work on Windows
      osInfo.memory = executeCommand('free -h');
      osInfo.disk = executeCommand('df -h .');
    }
    
    log('System information:', colors.blue);
    console.log(osInfo);
  } catch (error) {
    log(`Error checking system resources: ${error.message}`, colors.red);
  }
}

function diagnoseNetworkIssues() {
  log('Checking network connectivity to required services...', colors.magenta);
  
  const hosts = [
    'registry.npmjs.org',
    'github.com',
    'api.github.com',
    'cloudflare.com',
  ];
  
  for (const host of hosts) {
    try {
      const result = executeCommand(`ping -c 1 ${host}`);
      log(`Network connectivity to ${host}: OK`, colors.green);
    } catch (error) {
      log(`Network connectivity to ${host}: FAILED`, colors.red);
    }
  }
}

// Main execution
function main() {
  log('=== BUILD FIXING AND OPTIMIZATION SCRIPT ===', colors.cyan);
  
  // Run fixer functions
  cleanBuildCache();
  fixPrismaIssues();
  installPolyfills();
  optimizeForBuild();
  
  if (isCI) {
    diagnoseNetworkIssues();
  }
  
  log('=== BUILD OPTIMIZATION COMPLETED ===', colors.green);
}

// Execute the script
main(); 