#!/usr/bin/env node

/**
 * Prepare Neon Database for Cloudflare Deployment
 * 
 * This script:
 * 1. Copies the Neon-specific schema to the main schema location
 * 2. Generates the Prisma client for Cloudflare
 * 3. Restores the original schema
 * 
 * Usage:
 *   node scripts/prepare-cloudflare-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define paths
const rootDir = path.resolve(__dirname, '..');
const neonSchemaPath = path.join(rootDir, 'prisma/neon.schema.prisma');
const mainSchemaPath = path.join(rootDir, 'prisma/schema.prisma');
const backupPath = path.join(rootDir, 'prisma/schema.backup.prisma');

// Function to check if Neon environment variables are set
function validateEnvironment() {
  const requiredVars = ['DATABASE_URL', 'DIRECT_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('These must be set for Neon database on Cloudflare to work correctly.');
    process.exit(1);
  }
  
  console.log('✓ Environment variables verified');
}

// Main function
async function main() {
  console.log('Starting Cloudflare database preparation...');
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Check if Neon schema exists
    if (!fs.existsSync(neonSchemaPath)) {
      console.error(`❌ Neon schema not found at ${neonSchemaPath}`);
      process.exit(1);
    }
    
    // Back up original schema if it exists
    if (fs.existsSync(mainSchemaPath)) {
      console.log('Backing up original schema...');
      fs.copyFileSync(mainSchemaPath, backupPath);
      console.log(`✓ Original schema backed up to ${backupPath}`);
    }
    
    // Copy Neon schema to main schema
    console.log('Copying Neon schema to main location...');
    fs.copyFileSync(neonSchemaPath, mainSchemaPath);
    console.log(`✓ Neon schema copied to ${mainSchemaPath}`);
    
    // Install necessary dependencies
    console.log('Installing Neon PostgreSQL dependencies...');
    execSync('npm install @prisma/adapter-neon @neondatabase/serverless --save', { 
      stdio: 'inherit',
      cwd: rootDir
    });
    console.log('✓ Dependencies installed');
    
    // Generate Prisma client
    console.log('Generating Prisma client for Cloudflare...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: rootDir,
      env: {
        ...process.env,
        // Ensure we're using the correct database URL
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL
      }
    });
    console.log('✓ Prisma client generated');
    
    // Success message
    console.log('\n✅ Cloudflare database preparation complete!');
    console.log('Your application is now configured to use Neon PostgreSQL with Cloudflare.');
    
  } catch (error) {
    // Handle errors
    console.error(`❌ Error preparing database for Cloudflare:`, error);
    process.exit(1);
  } finally {
    // Restore original schema if backup exists
    if (fs.existsSync(backupPath)) {
      console.log('Restoring original schema...');
      fs.copyFileSync(backupPath, mainSchemaPath);
      fs.unlinkSync(backupPath);
      console.log('✓ Original schema restored');
    }
  }
}

// Run the script
main(); 