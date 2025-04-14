#!/usr/bin/env node

/**
 * Log rotation script
 * 
 * This script rotates log files, compressing old logs and removing files
 * that exceed the retention period to prevent disk space issues.
 * 
 * Usage:
 *   node logger-rotation.js
 * 
 * Environment variables:
 *   - LOG_DIR: Directory containing logs (default: ../../../logs)
 *   - LOG_RETENTION_DAYS: Days to keep logs (default: 30)
 *   - COMPRESS_LOGS_OLDER_THAN_DAYS: Days before compressing (default: 7)
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const { exec } = require('child_process');
const { format, subDays, parse, isAfter, isBefore } = require('date-fns');

// Promisify functions
const fsPromises = fs.promises;
const execPromise = util.promisify(exec);
const gzipPromise = util.promisify(zlib.gzip);

// Configuration
require('dotenv').config();
const LOG_DIR = process.env.LOG_DIR || path.resolve(__dirname, '../../../logs');
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
const COMPRESS_LOGS_OLDER_THAN_DAYS = parseInt(process.env.COMPRESS_LOGS_OLDER_THAN_DAYS || '7', 10);

// Set up logging
const SCRIPT_LOG_FILE = path.join(LOG_DIR, 'log-rotation.log');

/**
 * Write a log message to the script's log file
 */
async function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  try {
    await fsPromises.appendFile(SCRIPT_LOG_FILE, logEntry);
  } catch (error) {
    console.error(`Error writing to log: ${error.message}`);
  }
}

/**
 * Ensure log directory exists
 */
async function ensureLogDir() {
  try {
    await fsPromises.mkdir(LOG_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating log directory: ${error.message}`);
    return false;
  }
}

/**
 * Parse date from a log filename
 * Expected format: something-YYYY-MM-DD.log
 */
function parseDateFromFilename(filename) {
  // Try to extract a date in the format YYYY-MM-DD from the filename
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  
  if (dateMatch) {
    try {
      return parse(dateMatch[1], 'yyyy-MM-dd', new Date());
    } catch (error) {
      return null;
    }
  }
  
  return null;
}

/**
 * Get file stats with additional metadata
 */
async function getFileStats(filePath) {
  try {
    const stats = await fsPromises.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isCompressed: path.extname(filePath) === '.gz',
      dateInName: parseDateFromFilename(path.basename(filePath))
    };
  } catch (error) {
    console.error(`Error getting stats for ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Get all log files with stats
 */
async function getLogFiles() {
  try {
    const files = await fsPromises.readdir(LOG_DIR);
    
    // Get stats for each file and filter out non-files
    const filePromises = files.map(file => getFileStats(path.join(LOG_DIR, file)));
    const fileStats = (await Promise.all(filePromises)).filter(Boolean);
    
    // Only include log files
    return fileStats.filter(file => 
      (file.name.endsWith('.log') || file.name.endsWith('.log.gz')) && 
      !file.name.includes('log-rotation')
    );
  } catch (error) {
    await writeLog(`Error reading log directory: ${error.message}`);
    return [];
  }
}

/**
 * Compress a log file
 */
async function compressFile(filePath) {
  try {
    // Read the file content
    const content = await fsPromises.readFile(filePath);
    
    // Compress the content
    const compressed = await gzipPromise(content);
    
    // Write the compressed content to a new file
    const compressedPath = `${filePath}.gz`;
    await fsPromises.writeFile(compressedPath, compressed);
    
    // Delete the original file after successful compression
    await fsPromises.unlink(filePath);
    
    return {
      success: true,
      originalSize: content.length,
      compressedSize: compressed.length,
      compressionRatio: (content.length / compressed.length).toFixed(2),
      path: compressedPath
    };
  } catch (error) {
    await writeLog(`Error compressing ${filePath}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a file
 */
async function deleteFile(filePath) {
  try {
    await fsPromises.unlink(filePath);
    return { success: true, path: filePath };
  } catch (error) {
    await writeLog(`Error deleting ${filePath}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Format bytes to a human-readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Main function
 */
async function main() {
  try {
    // Ensure log directory exists
    const dirExists = await ensureLogDir();
    if (!dirExists) {
      process.exit(1);
    }
    
    await writeLog('--- Starting Log Rotation ---');
    
    // Get all log files
    const logFiles = await getLogFiles();
    await writeLog(`Found ${logFiles.length} log files`);
    
    // Calculate dates for comparison
    const now = new Date();
    const compressBeforeDate = subDays(now, COMPRESS_LOGS_OLDER_THAN_DAYS);
    const deleteBeforeDate = subDays(now, LOG_RETENTION_DAYS);
    
    let totalCompressed = 0;
    let totalDeleted = 0;
    let spaceSaved = 0;
    
    // Process each file
    for (const file of logFiles) {
      // Determine file date - use the date in filename if available, otherwise use modified date
      const fileDate = file.dateInName || file.modified;
      
      // Delete old files that exceed retention period
      if (isBefore(fileDate, deleteBeforeDate)) {
        await writeLog(`Deleting old log file: ${file.name} (${formatBytes(file.size)})`);
        const result = await deleteFile(file.path);
        
        if (result.success) {
          totalDeleted++;
          spaceSaved += file.size;
        }
        continue;
      }
      
      // Compress files older than compression threshold but not yet compressed
      if (!file.isCompressed && isBefore(fileDate, compressBeforeDate)) {
        await writeLog(`Compressing log file: ${file.name} (${formatBytes(file.size)})`);
        const result = await compressFile(file.path);
        
        if (result.success) {
          totalCompressed++;
          spaceSaved += (result.originalSize - result.compressedSize);
          await writeLog(`Compressed ${file.name} - Compression ratio: ${result.compressionRatio}x`);
        }
      }
    }
    
    // Summary
    await writeLog('--- Log Rotation Summary ---');
    await writeLog(`Compressed ${totalCompressed} files`);
    await writeLog(`Deleted ${totalDeleted} files`);
    await writeLog(`Total space saved: ${formatBytes(spaceSaved)}`);
    await writeLog('--- Log Rotation Complete ---');
    
  } catch (error) {
    console.error(`Log rotation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 