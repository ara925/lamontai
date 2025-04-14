#!/usr/bin/env node

/**
 * Database restore script
 * 
 * This script restores a PostgreSQL database from a backup file
 * 
 * Usage:
 *   node db-restore.js <backup-file>
 * 
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection URL (required)
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

// Use promisified versions of Node.js functions
const execPromise = util.promisify(exec);
const accessPromise = util.promisify(fs.access);

// Configuration from environment variables
require('dotenv').config();
const DB_URL = process.env.DATABASE_URL;
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

// List available backups
async function listBackups() {
  try {
    const files = await fs.promises.readdir(BACKUP_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
      console.log('No backups found');
      return [];
    }
    
    // Get details for each backup file
    const backupsWithStats = await Promise.all(
      sqlFiles.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.promises.stat(filePath);
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          date: stats.mtime
        };
      })
    );
    
    // Sort backups by date (newest first)
    backupsWithStats.sort((a, b) => b.date - a.date);
    
    console.log(`Found ${sqlFiles.length} backup(s):`);
    // Display backup information
    backupsWithStats.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.filename} (${formatFileSize(backup.size)}, created on ${format(backup.date, 'yyyy-MM-dd HH:mm:ss')})`);
    });
    
    return backupsWithStats;
  } catch (error) {
    console.error(`Error listing backups: ${error.message}`);
    return [];
  }
}

// Restore database from backup file
async function restoreDatabase(backupFilePath) {
  if (!DB_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  try {
    // Check if file exists
    await accessPromise(backupFilePath, fs.constants.R_OK);
  } catch (error) {
    console.error(`Cannot access backup file: ${error.message}`);
    process.exit(1);
  }
  
  const dbConfig = parseDatabaseUrl(DB_URL);
  console.log(`Preparing to restore database ${dbConfig.database} from ${backupFilePath}...`);
  
  // Set environment variables for psql
  const env = {
    PGUSER: dbConfig.user,
    PGPASSWORD: dbConfig.password,
    PGHOST: dbConfig.host,
    PGPORT: dbConfig.port,
    PGDATABASE: dbConfig.database
  };
  
  // Ask for confirmation
  console.log(`WARNING: This will replace the current database ${dbConfig.database} with the data from the backup.`);
  console.log('Create a backup of your current database first if you want to keep the current data.');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve, reject) => {
    readline.question('Do you want to proceed? (yes/no): ', async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore operation cancelled');
        resolve(false);
        return;
      }
      
      try {
        console.log('Restoring database...');
        
        // First disconnect all users
        await execPromise(
          `psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${dbConfig.database}' AND pid <> pg_backend_pid();"`,
          { env }
        );
        
        // Restore from backup
        const { stdout, stderr } = await execPromise(
          `psql -f "${backupFilePath}"`,
          { env }
        );
        
        if (stderr && !stderr.includes('WARNING')) {
          console.error(`Error during restore: ${stderr}`);
          reject(new Error(stderr));
        } else {
          console.log('Database restored successfully!');
          resolve(true);
        }
      } catch (error) {
        console.error(`Error restoring database: ${error.message}`);
        reject(error);
      }
    });
  });
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
    // Check if a specific backup file was provided
    const backupFile = process.argv[2];
    let backupPath;
    
    if (backupFile) {
      // Use the provided backup file
      backupPath = path.resolve(backupFile);
      console.log(`Using specified backup file: ${backupPath}`);
    } else {
      // List available backups and let user choose
      const backups = await listBackups();
      
      if (backups.length === 0) {
        console.log('No backups available. Create a backup first.');
        process.exit(0);
      }
      
      // Ask user to choose a backup
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        readline.question(`Enter backup number (1-${backups.length}) to restore: `, (answer) => {
          readline.close();
          
          const index = parseInt(answer, 10) - 1;
          if (isNaN(index) || index < 0 || index >= backups.length) {
            console.error('Invalid selection');
            process.exit(1);
          }
          
          backupPath = backups[index].path;
          console.log(`Selected backup: ${backups[index].filename}`);
          resolve();
        });
      });
    }
    
    // Restore the database
    await restoreDatabase(backupPath);
    
  } catch (error) {
    console.error(`Restore process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
} 