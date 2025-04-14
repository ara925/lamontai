#!/usr/bin/env node

/**
 * Database backup script
 * 
 * This script creates backups of the PostgreSQL database
 * It can be run manually or scheduled with cron
 * 
 * Usage:
 *   node database-backup.js
 * 
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection URL (required)
 *   - BACKUP_DIR: Directory to store backups (default: ./backups)
 *   - RETENTION_DAYS: Number of days to keep backups (default: 14)
 *   - AWS_S3_BUCKET: S3 bucket for offsite backups (optional)
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Use promisified versions of Node.js functions
const execPromise = util.promisify(exec);
const mkdirPromise = util.promisify(fs.mkdir);
const readdirPromise = util.promisify(fs.readdir);
const statPromise = util.promisify(fs.stat);
const unlinkPromise = util.promisify(fs.unlink);

// Configuration (from environment variables)
const DB_URL = process.env.DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '..', 'backups');
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '14', 10);
const S3_BUCKET = process.env.AWS_S3_BUCKET;

// Ensure the backup directory exists
async function ensureBackupDir() {
  try {
    await mkdirPromise(BACKUP_DIR, { recursive: true });
    console.log(`Backup directory created: ${BACKUP_DIR}`);
  } catch (error) {
    console.error(`Error creating backup directory: ${error.message}`);
    process.exit(1);
  }
}

// Parse database connection URL
function parseDatabaseUrl(url) {
  try {
    const pattern = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const matches = url.match(pattern);
    
    if (!matches) {
      throw new Error('Invalid database URL format');
    }
    
    return {
      user: matches[1],
      password: matches[2],
      host: matches[3],
      port: matches[4],
      database: matches[5]
    };
  } catch (error) {
    console.error(`Error parsing database URL: ${error.message}`);
    process.exit(1);
  }
}

// Create database backup
async function createBackup() {
  if (!DB_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const dbConfig = parseDatabaseUrl(DB_URL);
  
  // Create backup file name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup-${dbConfig.database}-${timestamp}.sql.gz`);
  
  // Set environment variables for pg_dump
  const env = {
    PGUSER: dbConfig.user,
    PGPASSWORD: dbConfig.password,
    PGHOST: dbConfig.host,
    PGPORT: dbConfig.port,
    PGDATABASE: dbConfig.database
  };
  
  try {
    console.log(`Starting backup of database ${dbConfig.database}...`);
    
    // Create backup using pg_dump and compress it with gzip
    const cmd = `pg_dump --format=plain --no-owner --no-acl | gzip > "${backupFile}"`;
    await execPromise(cmd, { env });
    
    console.log(`Backup created successfully: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error(`Error creating backup: ${error.message}`);
    throw error;
  }
}

// Upload backup to S3 if configured
async function uploadToS3(backupFile) {
  if (!S3_BUCKET) {
    console.log('No S3 bucket configured, skipping offsite backup');
    return;
  }
  
  try {
    console.log(`Uploading backup to S3 bucket: ${S3_BUCKET}...`);
    
    const fileName = path.basename(backupFile);
    const cmd = `aws s3 cp "${backupFile}" "s3://${S3_BUCKET}/database-backups/${fileName}"`;
    await execPromise(cmd);
    
    console.log('Backup uploaded to S3 successfully');
  } catch (error) {
    console.error(`Error uploading backup to S3: ${error.message}`);
    // Continue execution, don't exit - the local backup is still valid
  }
}

// Clean up old backups
async function cleanupOldBackups() {
  try {
    console.log(`Cleaning up backups older than ${RETENTION_DAYS} days...`);
    
    const files = await readdirPromise(BACKUP_DIR);
    const now = new Date();
    
    for (const file of files) {
      if (!file.startsWith('backup-')) continue;
      
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await statPromise(filePath);
      const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Age in days
      
      if (fileAge > RETENTION_DAYS) {
        await unlinkPromise(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error(`Error cleaning up old backups: ${error.message}`);
    // Continue execution, don't exit - this is not critical
  }
}

// Main function
async function main() {
  try {
    await ensureBackupDir();
    const backupFile = await createBackup();
    await uploadToS3(backupFile);
    await cleanupOldBackups();
    console.log('Backup process completed successfully');
  } catch (error) {
    console.error(`Backup process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 