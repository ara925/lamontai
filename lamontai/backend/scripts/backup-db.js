#!/usr/bin/env node

/**
 * PostgreSQL Database Backup Script
 * Backs up database to a compressed file
 * 
 * Usage:
 * - Set your database configuration in .env file
 * - Run with node scripts/backup-db.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { createGzip } = require('zlib');

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

// Create backups directory if it doesn't exist
const backupDir = path.resolve(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate backup filename with date and time
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `${DB_NAME}-backup-${timestamp}.sql.gz`);

console.log(`Starting backup of database ${DB_NAME} to ${backupFile}...`);

// Set up environment variables for pg_dump
const env = { ...process.env };
if (DB_PASSWORD) {
  env.PGPASSWORD = DB_PASSWORD;
}

// Create a gzip stream
const gzipStream = createGzip();
const outputStream = fs.createWriteStream(backupFile);

// Pipe the gzip stream to the output file
gzipStream.pipe(outputStream);

// Execute pg_dump command
const pgDump = spawn('pg_dump', [
  '--dbname', `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  '--format', 'plain',
  '--no-owner',
  '--no-acl'
], { env });

// Pipe the output of pg_dump to gzip
pgDump.stdout.pipe(gzipStream);

// Handle error output
pgDump.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Handle completion
pgDump.on('close', (code) => {
  if (code === 0) {
    console.log(`Backup completed successfully: ${backupFile}`);
    // Get file size
    const stats = fs.statSync(backupFile);
    console.log(`Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error(`pg_dump process exited with code ${code}`);
    // Try to remove the failed backup file
    if (fs.existsSync(backupFile)) {
      fs.unlinkSync(backupFile);
      console.log(`Removed failed backup file: ${backupFile}`);
    }
  }
});

// Handle errors in the output stream
outputStream.on('error', (err) => {
  console.error('Error writing to backup file:', err);
  process.exit(1);
});

// Log when the output file is closed
outputStream.on('finish', () => {
  console.log('Backup file written and closed.');
}); 