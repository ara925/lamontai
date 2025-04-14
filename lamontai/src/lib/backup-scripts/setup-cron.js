#!/usr/bin/env node

/**
 * Script to setup cron jobs for database backups and monitoring
 * 
 * This script adds entries to the system's crontab for:
 * - Regular database backups
 * - Database vacuum operations
 * - System monitoring checks
 * 
 * Usage:
 *   node setup-cron.js [--remove]
 * 
 * Options:
 *   --remove: Remove the cron jobs instead of adding them
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');

// Use promisified functions
const execPromise = util.promisify(exec);
const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);

// Main paths
const appDir = path.resolve(__dirname, '..', '..', '..');
const backupScriptPath = path.join(appDir, 'src', 'lib', 'backup-scripts', 'database-backup.js');
const vacuumScriptPath = path.join(appDir, 'src', 'lib', 'backup-scripts', 'database-vacuum.js');
const monitorScriptPath = path.join(appDir, 'src', 'lib', 'backup-scripts', 'system-monitor.js');

// Load environment variables
require('dotenv').config({ path: path.join(appDir, '.env') });

// Comment marker to identify our cron jobs
const CRON_MARKER = '# LAMONTAI-MANAGED-CRONJOB';

// Parse command line arguments
const removeJobs = process.argv.includes('--remove');

// Cron job definitions
const cronJobs = [
  // Daily database backup at 1 AM
  {
    schedule: '0 1 * * *',
    command: `cd ${appDir} && /usr/bin/node ${backupScriptPath} >> ${appDir}/logs/backup.log 2>&1`,
    description: 'Daily database backup'
  },
  // Weekly vacuum/analyze on Sunday at 3 AM
  {
    schedule: '0 3 * * 0',
    command: `cd ${appDir} && /usr/bin/node ${vacuumScriptPath} >> ${appDir}/logs/vacuum.log 2>&1`,
    description: 'Weekly database vacuum and analyze'
  },
  // System monitoring every 5 minutes
  {
    schedule: '*/5 * * * *',
    command: `cd ${appDir} && /usr/bin/node ${monitorScriptPath} >> ${appDir}/logs/monitor.log 2>&1`,
    description: 'System monitoring check'
  }
];

// Function to get current crontab
async function getCurrentCrontab() {
  try {
    const { stdout } = await execPromise('crontab -l');
    return stdout;
  } catch (error) {
    // If crontab is empty, return an empty string
    if (error.stderr && error.stderr.includes('no crontab')) {
      return '';
    }
    throw error;
  }
}

// Function to update crontab
async function updateCrontab(newCrontab) {
  const tempFile = path.join(os.tmpdir(), `crontab-${Date.now()}.txt`);
  
  try {
    // Write the new crontab to a temporary file
    await writeFilePromise(tempFile, newCrontab);
    
    // Install the new crontab
    await execPromise(`crontab ${tempFile}`);
    
    // Remove the temporary file
    fs.unlinkSync(tempFile);
    
    console.log('Crontab updated successfully');
  } catch (error) {
    console.error(`Error updating crontab: ${error.message}`);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    throw error;
  }
}

// Function to add cron jobs
async function addCronJobs() {
  try {
    // Get current crontab
    let currentCrontab = await getCurrentCrontab();
    
    // Remove any existing managed jobs
    const lines = currentCrontab.split('\n').filter(line => !line.includes(CRON_MARKER));
    
    // Create the new crontab with our jobs
    let newCrontab = lines.join('\n');
    if (newCrontab && !newCrontab.endsWith('\n')) {
      newCrontab += '\n';
    }
    
    // Add the new cron jobs
    for (const job of cronJobs) {
      newCrontab += `${job.schedule} ${job.command} ${CRON_MARKER} # ${job.description}\n`;
    }
    
    // Update the crontab
    await updateCrontab(newCrontab);
    
    console.log('Cron jobs added successfully:');
    cronJobs.forEach(job => {
      console.log(`- ${job.description}: ${job.schedule}`);
    });
  } catch (error) {
    console.error(`Error adding cron jobs: ${error.message}`);
    process.exit(1);
  }
}

// Function to remove cron jobs
async function removeCronJobs() {
  try {
    // Get current crontab
    const currentCrontab = await getCurrentCrontab();
    
    // Remove any lines containing our marker
    const lines = currentCrontab.split('\n').filter(line => !line.includes(CRON_MARKER));
    const newCrontab = lines.join('\n');
    
    // Update the crontab
    await updateCrontab(newCrontab);
    
    console.log('Cron jobs removed successfully');
  } catch (error) {
    console.error(`Error removing cron jobs: ${error.message}`);
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    if (removeJobs) {
      await removeCronJobs();
    } else {
      await addCronJobs();
    }
  } catch (error) {
    console.error(`Cron setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 