/**
 * Log Rotation Script
 * 
 * This script manages log files by:
 * 1. Compressing log files older than a specified threshold
 * 2. Deleting log files older than the retention period
 * 
 * Environment Variables:
 * - LOG_DIR: Directory containing log files (default: './logs')
 * - LOG_RETENTION_DAYS: Number of days to keep log files (default: 30)
 * - COMPRESS_LOGS_OLDER_THAN_DAYS: Compress files older than this many days (default: 7)
 * 
 * Usage:
 * node rotate-logs.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const { format, subDays, parseISO, isValid } = require('date-fns');

// Convert callback-based functions to Promise-based
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);
const createReadStream = fs.createReadStream;
const createWriteStream = fs.createWriteStream;
const createGzip = zlib.createGzip;
const pipeline = util.promisify(require('stream').pipeline);

// Configuration (with defaults)
const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
const COMPRESS_LOGS_OLDER_THAN_DAYS = parseInt(process.env.COMPRESS_LOGS_OLDER_THAN_DAYS || '7', 10);
const SCRIPT_LOG_FILE = path.join(LOG_DIR, 'rotate-logs.log');

// Helper function to log messages
async function logMessage(message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    // Ensure the log directory exists
    await ensureLogDirExists();
    
    // Append to the log file
    fs.appendFileSync(SCRIPT_LOG_FILE, logEntry);
    
    // Also output to console
    console.log(message);
  } catch (error) {
    console.error(`Error writing to log file: ${error.message}`);
  }
}

// Ensure log directory exists
async function ensureLogDirExists() {
  try {
    await mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Parse date from log filename (expected format: service-YYYY-MM-DD.log)
function parseDateFromFilename(filename) {
  const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) {
    const dateStr = dateMatch[0];
    const parsedDate = parseISO(dateStr);
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }
  return null;
}

// Get file stats including size and modification date
async function getFileStats(filePath) {
  try {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      modifiedDate: stats.mtime
    };
  } catch (error) {
    await logMessage(`Error getting stats for ${filePath}: ${error.message}`);
    return null;
  }
}

// Compress a log file
async function compressFile(filePath) {
  if (filePath.endsWith('.gz')) {
    return { success: false, reason: 'Already compressed' };
  }
  
  const gzipPath = `${filePath}.gz`;
  
  try {
    // Get original file size for reporting
    const fileStats = await getFileStats(filePath);
    if (!fileStats) {
      return { success: false, reason: 'Could not get file stats' };
    }
    
    // Compress the file
    await pipeline(
      createReadStream(filePath),
      createGzip(),
      createWriteStream(gzipPath)
    );
    
    // Get compressed file size
    const compressedStats = await getFileStats(gzipPath);
    if (!compressedStats) {
      return { success: false, reason: 'Could not get compressed file stats' };
    }
    
    // Delete the original file
    await unlink(filePath);
    
    return {
      success: true,
      originalSize: fileStats.size,
      compressedSize: compressedStats.size,
      spaceSaved: fileStats.size - compressedStats.size
    };
  } catch (error) {
    await logMessage(`Error compressing ${filePath}: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// Delete a log file
async function deleteFile(filePath) {
  try {
    const fileStats = await getFileStats(filePath);
    if (!fileStats) {
      return { success: false, reason: 'Could not get file stats' };
    }
    
    await unlink(filePath);
    return {
      success: true,
      sizeReclaimed: fileStats.size
    };
  } catch (error) {
    await logMessage(`Error deleting ${filePath}: ${error.message}`);
    return { success: false, reason: error.message };
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

// Main function to rotate logs
async function rotateLogFiles() {
  try {
    // Ensure log directory exists
    await ensureLogDirExists();
    
    await logMessage('Starting log rotation process');
    
    // Calculate date thresholds
    const now = new Date();
    const retentionThreshold = subDays(now, LOG_RETENTION_DAYS);
    const compressionThreshold = subDays(now, COMPRESS_LOGS_OLDER_THAN_DAYS);
    
    await logMessage(`Retention threshold: ${format(retentionThreshold, 'yyyy-MM-dd')}`);
    await logMessage(`Compression threshold: ${format(compressionThreshold, 'yyyy-MM-dd')}`);
    
    // Get all files in the log directory
    const files = await readdir(LOG_DIR);
    const logFiles = files.filter(file => 
      file.endsWith('.log') || file.endsWith('.log.gz')
    );
    
    await logMessage(`Found ${logFiles.length} log files to process`);
    
    let compressedCount = 0;
    let deletedCount = 0;
    let totalSpaceSaved = 0;
    
    // Process each log file
    for (const file of logFiles) {
      const filePath = path.join(LOG_DIR, file);
      
      // Skip the script's own log file
      if (file === path.basename(SCRIPT_LOG_FILE)) {
        continue;
      }
      
      const stats = await getFileStats(filePath);
      if (!stats) continue;
      
      // Determine file date from filename or use modification date as fallback
      const fileDate = parseDateFromFilename(file) || stats.modifiedDate;
      
      // Delete old files
      if (fileDate < retentionThreshold) {
        await logMessage(`Deleting old file: ${file} (${format(fileDate, 'yyyy-MM-dd')})`);
        const result = await deleteFile(filePath);
        
        if (result.success) {
          deletedCount++;
          totalSpaceSaved += result.sizeReclaimed;
          await logMessage(`Deleted ${file}, reclaimed ${formatBytes(result.sizeReclaimed)}`);
        }
      }
      // Compress files older than compression threshold but newer than retention threshold
      else if (!file.endsWith('.gz') && fileDate < compressionThreshold) {
        await logMessage(`Compressing file: ${file} (${format(fileDate, 'yyyy-MM-dd')})`);
        const result = await compressFile(filePath);
        
        if (result.success) {
          compressedCount++;
          totalSpaceSaved += result.spaceSaved;
          await logMessage(
            `Compressed ${file}: ${formatBytes(result.originalSize)} → ` +
            `${formatBytes(result.compressedSize)} (${formatBytes(result.spaceSaved)} saved)`
          );
        }
      }
    }
    
    await logMessage(`Log rotation completed: ${compressedCount} files compressed, ${deletedCount} files deleted`);
    await logMessage(`Total space saved: ${formatBytes(totalSpaceSaved)}`);
    
  } catch (error) {
    await logMessage(`Error during log rotation: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
rotateLogFiles().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 