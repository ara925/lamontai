/**
 * Initialize the Cloudflare database schema
 * This script creates the database schema in a Cloudflare D1 or PostgreSQL database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Pool } = require('pg');

// Colors for terminal output
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
 * Load environment variables from .env.local file
 */
function loadEnvVars() {
  try {
    const envFile = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envFile)) {
      log('Error: .env.local file not found!', colors.red);
      log('Run setup-cloudflare-db.sh first to create it.', colors.yellow);
      process.exit(1);
    }
    
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  } catch (error) {
    log(`Error loading environment variables: ${error.message}`, colors.red);
    process.exit(1);
  }
}

/**
 * Check if the database URL is a Cloudflare D1 URL
 */
function isCloudflareD1(databaseUrl) {
  return databaseUrl.startsWith('prisma://');
}

/**
 * Initialize database schema using Prisma CLI
 */
async function initializeWithPrisma(databaseUrl) {
  log('Initializing database schema using Prisma...', colors.blue);
  
  try {
    process.env.DATABASE_URL = databaseUrl;
    
    // Deploy the schema to the database
    log('Running prisma db push...', colors.yellow);
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });
    
    log('Database schema initialized successfully! ✅', colors.green);
    return true;
  } catch (error) {
    log(`Error initializing database schema: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Initialize database with example data
 */
async function seedDatabase(databaseUrl) {
  log('Seeding database with example data...', colors.blue);
  
  try {
    process.env.DATABASE_URL = databaseUrl;
    
    // Run database seeding
    log('Running prisma db seed...', colors.yellow);
    execSync('npx prisma db seed', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });
    
    log('Database seeded successfully! ✅', colors.green);
    return true;
  } catch (error) {
    log(`Error seeding database: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Test PostgreSQL connection
 */
async function testPostgresConnection(databaseUrl) {
  log('Testing database connection...', colors.blue);
  
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    
    try {
      // Test connection
      log('Connecting to PostgreSQL database...', colors.yellow);
      const client = await pool.connect();
      
      // Get PostgreSQL version
      const result = await client.query('SELECT version()');
      const version = result.rows[0].version;
      log(`Connected to PostgreSQL: ${version} ✅`, colors.green);
      
      // Check for existing tables
      const tableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      if (tableResult.rows.length > 0) {
        log('Existing tables found:', colors.yellow);
        tableResult.rows.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        log('No existing tables found. Database is empty.', colors.yellow);
      }
      
      client.release();
      await pool.end();
      
      return true;
    } catch (error) {
      log(`Database connection error: ${error.message}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`Error creating database connection: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  log('Cloudflare Database Initialization', colors.magenta);
  log('==================================', colors.magenta);
  
  // Load environment variables
  const envVars = loadEnvVars();
  
  // Check for required variables
  if (!envVars.DATABASE_URL) {
    log('Error: DATABASE_URL not found in .env.local!', colors.red);
    process.exit(1);
  }
  
  if (!envVars.CLOUDFLARE_DB_ID) {
    log('Warning: CLOUDFLARE_DB_ID not found in .env.local!', colors.yellow);
  }
  
  const databaseUrl = envVars.DATABASE_URL;
  
  // Check database type
  if (isCloudflareD1(databaseUrl)) {
    log('Detected Cloudflare D1 database URL', colors.blue);
    log('D1 initialization not yet supported by this script.', colors.yellow);
    log('Please use the Cloudflare dashboard to initialize your D1 database.', colors.yellow);
    process.exit(0);
  } else {
    log('Detected PostgreSQL database URL', colors.blue);
    
    // Test database connection
    const connectionSuccessful = await testPostgresConnection(databaseUrl);
    
    if (!connectionSuccessful) {
      log('Error: Could not connect to the PostgreSQL database!', colors.red);
      log('Please check your DATABASE_URL and try again.', colors.yellow);
      process.exit(1);
    }
    
    // Ask if the user wants to initialize the schema
    console.log('');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Do you want to initialize the database schema? This will overwrite existing tables. (y/n) ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Initialize database schema
        const schemaInitialized = await initializeWithPrisma(databaseUrl);
        
        if (schemaInitialized) {
          // Ask if the user wants to seed the database
          readline.question('Do you want to seed the database with example data? (y/n) ', async (seedAnswer) => {
            if (seedAnswer.toLowerCase() === 'y' || seedAnswer.toLowerCase() === 'yes') {
              // Seed database
              await seedDatabase(databaseUrl);
            } else {
              log('Skipping database seeding.', colors.yellow);
            }
            
            log('\nDatabase initialization complete! 🚀', colors.magenta);
            log('Your Cloudflare database is now ready to use.', colors.green);
            readline.close();
          });
        } else {
          log('Database initialization failed!', colors.red);
          readline.close();
          process.exit(1);
        }
      } else {
        log('Skipping database initialization.', colors.yellow);
        readline.close();
      }
    });
  }
}

// Run the main function
main(); 