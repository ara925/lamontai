#!/usr/bin/env node

/**
 * Database backup script
 * 
 * This script creates a backup of the PostgreSQL database and stores it
 * in the backups directory with timestamp
 * 
 * Usage:
 *   node db-backup.js
 * 
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection URL (required)
 *   - BACKUP_RETENTION_DAYS: Number of days to keep backups (default: 7)
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

// Use promisified versions of Node.js functions
const execPromise = util.promisify(exec);
const mkdirPromise = util.promisify(fs.mkdir);
const readDirPromise = util.promisify(fs.readdir);
const statPromise = util.promisify(fs.stat);
const unlinkPromise = util.promisify(fs.unlink);

// Configuration from environment variables
require('dotenv').config();
const DB_URL = process.env.DATABASE_URL;
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
const BACKUP_DIR = path.resolve(__dirname, '../../../backups');

// Parse database connection URL
function parseDatabaseUrl(url) {
  try {
    // Match pattern like: postgresql://username:password@hostname:port/database
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

// Ensure backup directory exists
async function ensureBackupDirExists() {
  try {
    await mkdirPromise(BACKUP_DIR, { recursive: true });
    console.log(`Backup directory ensured at ${BACKUP_DIR}`);
  } catch (error) {
    console.error(`Error creating backup directory: ${error.message}`);
    process.exit(1);
  }
}

// Create a database backup
async function createBackup() {
  if (!DB_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const dbConfig = parseDatabaseUrl(DB_URL);
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const backupFileName = `${dbConfig.database}_${timestamp}.sql`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);
  
  console.log(`Creating backup of database ${dbConfig.database} to ${backupFilePath}...`);
  
  // Set environment variables for pg_dump
  const env = {
    PGUSER: dbConfig.user,
    PGPASSWORD: dbConfig.password,
    PGHOST: dbConfig.host,
    PGPORT: dbConfig.port,
    PGDATABASE: dbConfig.database
  };
  
  try {
    // Create the backup using pg_dump
    const { stdout, stderr } = await execPromise(
      `pg_dump --format=plain --create --clean --if-exists > "${backupFilePath}"`, 
      { env }
    );
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error(`Error during backup: ${stderr}`);
    } else {
      const stats = await statPromise(backupFilePath);
      console.log(`Backup created successfully: ${backupFilePath} (${formatFileSize(stats.size)})`);
      return backupFilePath;
    }
  } catch (error) {
    console.error(`Error creating backup: ${error.message}`);
    process.exit(1);
  }
}

// Clean up old backups
async function cleanupOldBackups() {
  try {
    console.log(`Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days...`);
    
    const files = await readDirPromise(BACKUP_DIR);
    const now = new Date();
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await statPromise(filePath);
      const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // age in days
      
      if (fileAge > BACKUP_RETENTION_DAYS) {
        await unlinkPromise(filePath);
        deletedCount++;
        console.log(`Deleted old backup: ${file} (${formatFileSize(stats.size)}, ${Math.round(fileAge)} days old)`);
      }
    }
    
    if (deletedCount === 0) {
      console.log('No old backups needed to be deleted');
    } else {
      console.log(`Deleted ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.error(`Error cleaning up old backups: ${error.message}`);
  }
}

// List existing backups
async function listBackups() {
  try {
    const files = await readDirPromise(BACKUP_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
      console.log('No backups found');
      return;
    }
    
    console.log(`Found ${sqlFiles.length} backup(s):`);
    
    // Get details for each backup file
    const backupsWithStats = await Promise.all(
      sqlFiles.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await statPromise(filePath);
        return {
          filename: file,
          size: stats.size,
          date: stats.mtime
        };
      })
    );
    
    // Sort backups by date (newest first)
    backupsWithStats.sort((a, b) => b.date - a.date);
    
    // Display backup information
    backupsWithStats.forEach(backup => {
      console.log(`- ${backup.filename} (${formatFileSize(backup.size)}, created on ${format(backup.date, 'yyyy-MM-dd HH:mm:ss')})`);
    });
    
  } catch (error) {
    console.error(`Error listing backups: ${error.message}`);
  }
}

// Format file size for human-readable output
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Main function
async function main() {
  try {
    // Ensure backup directory exists
    await ensureBackupDirExists();
    
    // List existing backups
    await listBackups();
    
    // Create a new backup
    await createBackup();
    
    // Clean up old backups
    await cleanupOldBackups();
    
    // List backups after operations
    await listBackups();
    
    console.log('Backup process completed successfully');
  } catch (error) {
    console.error(`Backup process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 