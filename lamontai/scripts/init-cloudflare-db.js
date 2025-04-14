#!/usr/bin/env node
/**
 * Cloudflare Database Initialization Script
 * 
 * This script initializes the Cloudflare PostgreSQL database with:
 * 1. The required schema for NextAuth.js
 * 2. Basic seed data for the application
 * 
 * Usage:
 * $ node scripts/init-cloudflare-db.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

async function main() {
  log.info('Initializing Cloudflare database...');
  
  // Validate connection string
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    log.error('Missing DATABASE_URL environment variable');
    log.info('Please run setup-cloudflare-db.sh first to configure your database connection');
    process.exit(1);
  }
  
  // Check for Cloudflare database ID
  const cloudflareDbId = process.env.CLOUDFLARE_DB_ID;
  if (!cloudflareDbId) {
    log.error('Missing CLOUDFLARE_DB_ID environment variable');
    log.info('Please run setup-cloudflare-db.sh first to configure your database connection');
    process.exit(1);
  }
  
  log.info('Deploying Prisma schema to Cloudflare database...');
  
  try {
    // Run prisma migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    log.success('Schema deployed successfully');
  } catch (error) {
    log.error('Failed to deploy schema');
    log.error(error.message);
    process.exit(1);
  }
  
  // Create Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Seed the database with initial data
    log.info('Seeding database with initial data...');
    
    // Create admin user if it doesn't exist
    const adminEmail = 'admin@example.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      log.info('Creating admin user...');
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: '$2a$10$aSVuaESGmAdYl4.GZVfF2.7mA0O2LmXy8lLz6KL04x2W3BAR8CqBy', // admin123
          role: 'admin',
          settings: {
            create: {
              theme: 'dark',
              language: 'english',
              notifications: true
            }
          }
        }
      });
      log.success('Admin user created');
    } else {
      log.info('Admin user already exists, skipping creation');
    }
    
    // Create regular user if it doesn't exist
    const userEmail = 'user@example.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!existingUser) {
      log.info('Creating regular user...');
      await prisma.user.create({
        data: {
          name: 'Regular User',
          email: userEmail,
          password: '$2a$10$8Z1iQJuLoxfxOdQVE6wJzOuXcXSZANzVIQ/tUG/EZ6aKkdB4Z9VJe', // password123
          role: 'user',
          settings: {
            create: {
              theme: 'light',
              language: 'english',
              notifications: true
            }
          }
        }
      });
      log.success('Regular user created');
    } else {
      log.info('Regular user already exists, skipping creation');
    }
    
    // Create sample plan
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Pro Plan' }
    });
    
    if (!existingPlan) {
      log.info('Creating sample subscription plan...');
      await prisma.plan.create({
        data: {
          name: 'Pro Plan',
          price: 19.99,
          description: 'Professional plan with unlimited content generation',
          features: 'Unlimited content, SEO tools, Analytics'
        }
      });
      log.success('Sample plan created');
    } else {
      log.info('Sample plan already exists, skipping creation');
    }
    
    log.success('Database seeding completed');
    
  } catch (error) {
    log.error('Error seeding database');
    log.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  log.success('Cloudflare database initialization complete!');
  log.info('Your database is now ready to use with the application');
  log.info('Test your connection by running: npm run dev');
}

// Run the main function
main()
  .catch(error => {
    log.error('Unhandled error in initialization script');
    log.error(error.message);
    process.exit(1);
  }); 