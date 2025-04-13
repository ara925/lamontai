#!/usr/bin/env node

/**
 * PostgreSQL Database Restore Script
 * Restores database from a backup file
 * 
 * Usage:
 * - Set your database configuration in .env file
 * - Run with node scripts/restore-db.js path/to/backup.sql.gz
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { createGunzip } = require('zlib');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get database configuration from environment
const {
  DB_NAME = 'lamontai',
  DB_USER = process.env.DB_USER || 'postgres',
  DB_PASSWORD = process.env.DB_PASSWORD || 'postgres',
  DB_HOST = process.env.DB_HOST || 'localhost',
  DB_PORT = process.env.DB_PORT || '5434'
} = process.env;

// Check for backup file argument
const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Error: No backup file specified');
  console.log('Usage: node restore-db.js path/to/backup.sql[.gz]');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(backupFile)) {
  console.error(`Error: Backup file not found: ${backupFile}`);
  process.exit(1);
}

console.log(`Starting restore of database ${DB_NAME} from ${backupFile}...`);

// Set up environment variables for psql
const env = { ...process.env };
if (DB_PASSWORD) {
  env.PGPASSWORD = DB_PASSWORD;
}

// Function to restore the database
function restoreDatabase(inputFile) {
  console.log(`Restoring from: ${inputFile}`);
  
  // Use psql to restore the database
  const psql = spawn('psql', [
    '--dbname', `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
    '--file', inputFile
  ], { env });

  // Handle process output
  psql.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  psql.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  psql.on('close', (code) => {
    if (code === 0) {
      console.log(`Restore completed successfully from ${inputFile}`);
      
      // Clean up temporary uncompressed file if we were using a compressed one
      if (inputFile !== backupFile) {
        fs.unlinkSync(inputFile);
        console.log(`Removed temporary file: ${inputFile}`);
      }
    } else {
      console.error(`psql process exited with code ${code}`);
    }
  });
}

// Check if file is compressed
if (backupFile.endsWith('.gz')) {
  // Decompress file first
  const tempFile = backupFile.slice(0, -3); // Remove .gz extension
  console.log(`Decompressing backup file to ${tempFile}...`);
  
  const readStream = fs.createReadStream(backupFile);
  const writeStream = fs.createWriteStream(tempFile);
  const gunzip = createGunzip();
  
  readStream.pipe(gunzip).pipe(writeStream);
  
  writeStream.on('finish', () => {
    console.log('Decompression completed');
    restoreDatabase(tempFile);
  });
  
  writeStream.on('error', (err) => {
    console.error('Error decompressing file:', err);
    process.exit(1);
  });
} else {
  // File is not compressed, restore directly
  restoreDatabase(backupFile);
} 
 