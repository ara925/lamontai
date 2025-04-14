/**
 * Script to prepare the application for Cloudflare deployment
 * This script validates the environment and prepares the Prisma client
 * for deployment to Cloudflare Pages/Workers with Neon PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const ENV_FILE = path.join(process.cwd(), '.env.local');
const PRISMA_SCHEMA = path.join(process.cwd(), 'prisma', 'schema.prisma');
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET', 
  'NEXTAUTH_SECRET',
  'CLOUDFLARE_DB_ID'
];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log a message with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Check if the environment is properly configured
 */
function checkEnvironment() {
  log('Checking environment configuration...', colors.blue);
  
  // Check if .env.local exists
  if (!fs.existsSync(ENV_FILE)) {
    log('Error: .env.local file not found!', colors.red);
    log('Please create a .env.local file with the required environment variables.', colors.yellow);
    process.exit(1);
  }
  
  // Read .env.local
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  const envVars = {};
  
  // Parse environment variables
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key.trim()] = value.trim();
    }
  });
  
  // Check required environment variables
  let missingVars = [];
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!envVars[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    log(`Error: Missing required environment variables: ${missingVars.join(', ')}`, colors.red);
    log('Please add them to your .env.local file.', colors.yellow);
    process.exit(1);
  }
  
  // Validate DATABASE_URL format
  if (!envVars.DATABASE_URL.includes('postgresql://')) {
    log('Error: DATABASE_URL must be a PostgreSQL connection string!', colors.red);
    log('Example: postgresql://username:password@hostname:5432/database?sslmode=require', colors.yellow);
    process.exit(1);
  }
  
  log('Environment configuration is valid! ✅', colors.green);
  
  // Return environment variables
  return envVars;
}

/**
 * Update Prisma schema to use correct database URL
 */
function updatePrismaSchema() {
  log('Updating Prisma schema for Cloudflare compatibility...', colors.blue);
  
  try {
    let schemaContent = fs.readFileSync(PRISMA_SCHEMA, 'utf-8');
    
    // Make sure the schema is using the right database URL
    if (!schemaContent.includes('env("DATABASE_URL")')) {
      log('Error: Prisma schema does not use DATABASE_URL from environment!', colors.red);
      log('Please update your schema to use: url = env("DATABASE_URL")', colors.yellow);
      process.exit(1);
    }
    
    log('Prisma schema is compatible with Cloudflare! ✅', colors.green);
  } catch (error) {
    log(`Error reading Prisma schema: ${error.message}`, colors.red);
    process.exit(1);
  }
}

/**
 * Install Neon PostgreSQL dependencies
 */
function installNeonDependencies() {
  log('Installing Neon PostgreSQL dependencies...', colors.blue);
  
  try {
    // Check if @neondatabase/serverless is installed
    try {
      require('@neondatabase/serverless');
      require('@prisma/adapter-neon');
      log('Neon dependencies are already installed! ✅', colors.green);
    } catch (error) {
      // Install dependencies
      log('Installing @neondatabase/serverless and @prisma/adapter-neon...', colors.yellow);
      execSync('npm install @neondatabase/serverless @prisma/adapter-neon', { stdio: 'inherit' });
      log('Neon dependencies installed successfully! ✅', colors.green);
    }
  } catch (error) {
    log(`Error installing Neon dependencies: ${error.message}`, colors.red);
    process.exit(1);
  }
}

/**
 * Generate Prisma client optimized for Cloudflare
 */
function generatePrismaClient() {
  log('Generating Prisma client for Cloudflare...', colors.blue);
  
  try {
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    log('Prisma client generated successfully! ✅', colors.green);
  } catch (error) {
    log(`Error generating Prisma client: ${error.message}`, colors.red);
    process.exit(1);
  }
}

/**
 * Create a temporary .env.cloudflare file for the build
 */
function createCloudflareEnvFile(envVars) {
  log('Creating Cloudflare environment file...', colors.blue);
  
  try {
    const cloudflareEnvContent = `
# Cloudflare Edge Runtime Environment
DATABASE_URL=${envVars.DATABASE_URL}
CLOUDFLARE_DB_ID=${envVars.CLOUDFLARE_DB_ID}
NEXT_PUBLIC_DEPLOY_ENV=cloudflare
NEXT_PUBLIC_CLOUDFLARE_ENABLED=true
JWT_SECRET=${envVars.JWT_SECRET}
NEXTAUTH_SECRET=${envVars.NEXTAUTH_SECRET}
NEXTAUTH_URL=${envVars.NEXTAUTH_URL || 'https://app.lamontai.com'}
NODE_ENV=production
`;
    
    fs.writeFileSync(path.join(process.cwd(), '.env.cloudflare'), cloudflareEnvContent.trim());
    log('Cloudflare environment file created! ✅', colors.green);
  } catch (error) {
    log(`Error creating Cloudflare environment file: ${error.message}`, colors.red);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  log('Preparing application for Cloudflare deployment...', colors.magenta);
  
  // Check environment configuration
  const envVars = checkEnvironment();
  
  // Update Prisma schema
  updatePrismaSchema();
  
  // Install Neon PostgreSQL dependencies
  installNeonDependencies();
  
  // Generate Prisma client
  generatePrismaClient();
  
  // Create Cloudflare environment file
  createCloudflareEnvFile(envVars);
  
  log('Application is ready for Cloudflare deployment! 🚀', colors.magenta);
  log('\nYou can now run the following commands:', colors.cyan);
  log('  npm run build', colors.yellow);
  log('  npx @cloudflare/next-on-pages', colors.yellow);
  log('\nOr use the GitHub Actions workflow for automatic deployment.', colors.cyan);
}

// Run the main function
main(); 