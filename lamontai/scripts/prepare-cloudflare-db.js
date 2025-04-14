/**
 * Prepares environment variables and database for Cloudflare deployment
 * Required for the cloudflare:build npm script
 */

console.log('Preparing application for Cloudflare deployment...');
console.log('Checking environment configuration...');

// Check for required environment variables
const requiredVars = [
  'CLOUDFLARE_DB_ID'
];

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });

// Check if any required variables are missing
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please add them to your .env.local file.');
  process.exit(1);
}

// Proceed with the preparation
console.log('Environment variables validated successfully.');

// Add additional setup code here if needed
// For example, generating Prisma client, etc.

// You could add code to initialize the database schema here
// or create required tables if using D1

console.log('Cloudflare preparation completed successfully.'); 