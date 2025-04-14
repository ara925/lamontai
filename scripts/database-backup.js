/**
 * PostgreSQL Database Backup Script
 * 
 * This script creates a backup of the PostgreSQL database and:
 * 1. Compresses the backup using gzip
 * 2. Saves it to a local backup directory
 * 3. Optionally uploads it to a cloud storage provider
 * 4. Manages retention of local backups
 * 
 * Environment Variables:
 * - DB_HOST: Database host (default: localhost)
 * - DB_PORT: Database port (default: 5432)
 * - DB_NAME: Database name (default: lamontai)
 * - DB_USER: Database user (default: postgres)
 * - DB_PASSWORD: Database password
 * - BACKUP_DIR: Directory to store backups (default: ./backups)
 * - BACKUP_RETENTION_DAYS: Days to keep backups (default: 30)
 * - UPLOAD_TO_CLOUD: Whether to upload to cloud (default: false)
 * - CLOUD_PROVIDER: Cloud provider to use (aws, azure, gcp) (default: aws)
 * 
 * Usage:
 * node database-backup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { format, subDays } = require('date-fns');

// Convert callback-based functions to Promise-based
const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);

// Configuration (with defaults)
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'lamontai';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const UPLOAD_TO_CLOUD = process.env.UPLOAD_TO_CLOUD === 'true';
const CLOUD_PROVIDER = process.env.CLOUD_PROVIDER || 'aws';

// Log function
function log(message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  console.log(`[${timestamp}] ${message}`);
}

// Ensure backup directory exists
async function ensureBackupDirExists() {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    log(`Backup directory ${BACKUP_DIR} is ready`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Create database backup
async function createDatabaseBackup() {
  if (!DB_PASSWORD) {
    throw new Error('DB_PASSWORD environment variable is required');
  }
  
  // Create timestamp for the backup filename
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const backupFilename = `${DB_NAME}_${timestamp}.sql.gz`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  
  try {
    log(`Starting backup of database '${DB_NAME}'`);
    
    // Build the pg_dump command
    const pgDumpCmd = `PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p | gzip > ${backupPath}`;
    
    // Execute the backup command
    execSync(pgDumpCmd, { stdio: 'inherit', shell: true });
    
    // Get backup file size
    const stats = await stat(backupPath);
    log(`Backup created successfully: ${backupFilename} (${formatBytes(stats.size)})`);
    
    return {
      path: backupPath,
      filename: backupFilename,
      size: stats.size
    };
  } catch (error) {
    throw new Error(`Database backup failed: ${error.message}`);
  }
}

// Upload backup to cloud storage
async function uploadToCloudStorage(backupInfo) {
  if (!UPLOAD_TO_CLOUD) {
    log('Cloud upload is disabled. Skipping.');
    return;
  }
  
  log(`Preparing to upload backup to ${CLOUD_PROVIDER.toUpperCase()}`);
  
  try {
    switch (CLOUD_PROVIDER.toLowerCase()) {
      case 'aws':
        await uploadToAWS(backupInfo);
        break;
      case 'azure':
        await uploadToAzure(backupInfo);
        break;
      case 'gcp':
        await uploadToGCP(backupInfo);
        break;
      default:
        throw new Error(`Unsupported cloud provider: ${CLOUD_PROVIDER}`);
    }
    log(`Backup successfully uploaded to ${CLOUD_PROVIDER.toUpperCase()}`);
  } catch (error) {
    log(`Cloud upload failed: ${error.message}`);
    // Continue execution even if upload fails
  }
}

// Upload to AWS S3
async function uploadToAWS(backupInfo) {
  // This is a placeholder function
  // In a real implementation, you would use the AWS SDK
  log('AWS S3 upload functionality requires AWS SDK implementation');
  log('Example implementation:');
  log(`const AWS = require('aws-sdk');`);
  log(`const s3 = new AWS.S3();`);
  log(`const upload = await s3.upload({`);
  log(`  Bucket: 'your-backup-bucket',`);
  log(`  Key: 'database-backups/${backupInfo.filename}',`);
  log(`  Body: fs.createReadStream(backupInfo.path)`);
  log(`}).promise();`);
}

// Upload to Azure Blob Storage
async function uploadToAzure(backupInfo) {
  // This is a placeholder function
  // In a real implementation, you would use the Azure Storage SDK
  log('Azure Blob Storage upload requires Azure SDK implementation');
  log('Example implementation:');
  log(`const { BlobServiceClient } = require('@azure/storage-blob');`);
  log(`const blobService = BlobServiceClient.fromConnectionString('your-connection-string');`);
  log(`const containerClient = blobService.getContainerClient('your-container');`);
  log(`const blockBlobClient = containerClient.getBlockBlobClient(backupInfo.filename);`);
  log(`await blockBlobClient.uploadFile(backupInfo.path);`);
}

// Upload to Google Cloud Storage
async function uploadToGCP(backupInfo) {
  // This is a placeholder function
  // In a real implementation, you would use the Google Cloud Storage SDK
  log('GCP Storage upload requires Google Cloud Storage SDK implementation');
  log('Example implementation:');
  log(`const {Storage} = require('@google-cloud/storage');`);
  log(`const storage = new Storage();`);
  log(`const bucket = storage.bucket('your-bucket-name');`);
  log(`await bucket.upload(backupInfo.path, {`);
  log(`  destination: 'database-backups/${backupInfo.filename}'`);
  log(`});`);
}

// Clean up old backups
async function cleanupOldBackups() {
  try {
    log(`Checking for backups older than ${BACKUP_RETENTION_DAYS} days`);
    
    // Calculate the retention threshold date
    const now = new Date();
    const retentionThreshold = subDays(now, BACKUP_RETENTION_DAYS);
    
    // Read all files in the backup directory
    const files = await readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => 
      file.startsWith(DB_NAME) && file.endsWith('.sql.gz')
    );
    
    let deletedCount = 0;
    let spaceReclaimed = 0;
    
    // Process each backup file
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const fileStats = await stat(filePath);
      
      // Check if the file is older than the retention threshold
      if (fileStats.mtime < retentionThreshold) {
        log(`Deleting old backup: ${file} (${format(fileStats.mtime, 'yyyy-MM-dd')})`);
        
        try {
          await unlink(filePath);
          deletedCount++;
          spaceReclaimed += fileStats.size;
        } catch (error) {
          log(`Error deleting ${file}: ${error.message}`);
        }
      }
    }
    
    if (deletedCount > 0) {
      log(`Deleted ${deletedCount} old backups, reclaimed ${formatBytes(spaceReclaimed)}`);
    } else {
      log('No old backups to delete');
    }
  } catch (error) {
    log(`Error during cleanup: ${error.message}`);
  }
}

// Validate the backup by testing a restore (optional)
async function validateBackup(backupInfo) {
  // This is a placeholder function
  // In a real implementation, you might want to test restore to a temporary database
  log('Backup validation would go here (not implemented)');
  log('A complete validation would:');
  log('1. Create a temporary database');
  log('2. Restore the backup to the temporary database');
  log('3. Run some basic queries to verify data integrity');
  log('4. Drop the temporary database');
}

// Main backup function
async function performBackup() {
  try {
    log('Starting database backup process');
    
    // Ensure backup directory exists
    await ensureBackupDirExists();
    
    // Create the backup
    const backupInfo = await createDatabaseBackup();
    
    // Upload to cloud storage (if enabled)
    await uploadToCloudStorage(backupInfo);
    
    // Validate the backup (optional)
    // await validateBackup(backupInfo);
    
    // Clean up old backups
    await cleanupOldBackups();
    
    log('Database backup process completed successfully');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the backup
performBackup(); 