#!/usr/bin/env node

/**
 * System monitoring script
 * 
 * This script checks the health of the system and services
 * It monitors CPU, memory, disk usage, and database connectivity
 * 
 * Usage:
 *   node system-monitor.js
 * 
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection URL (required)
 *   - REDIS_URL: Redis connection URL (optional)
 *   - ALERT_THRESHOLD_CPU: CPU usage threshold in % (default: 80)
 *   - ALERT_THRESHOLD_MEMORY: Memory usage threshold in % (default: 80)
 *   - ALERT_THRESHOLD_DISK: Disk usage threshold in % (default: 80)
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use promisified versions of Node.js functions
const execPromise = util.promisify(exec);
const fsPromises = fs.promises;

// Configuration from environment variables
require('dotenv').config();
const DB_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;
const ALERT_THRESHOLD_CPU = parseInt(process.env.ALERT_THRESHOLD_CPU || '80', 10);
const ALERT_THRESHOLD_MEMORY = parseInt(process.env.ALERT_THRESHOLD_MEMORY || '80', 10);
const ALERT_THRESHOLD_DISK = parseInt(process.env.ALERT_THRESHOLD_DISK || '80', 10);

// Logs directory
const LOG_DIR = path.resolve(__dirname, '../../../logs');
const LOG_FILE = path.join(LOG_DIR, `system-monitor-${new Date().toISOString().slice(0, 10)}.log`);

// Ensure log directory exists
async function ensureLogDir() {
  try {
    await fsPromises.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error(`Error creating log directory: ${error.message}`);
  }
}

// Write to log file
async function writeLog(message) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    
    await fsPromises.appendFile(LOG_FILE, logEntry);
  } catch (error) {
    console.error(`Error writing to log: ${error.message}`);
  }
}

// Check CPU usage
async function checkCpuUsage() {
  try {
    // Get CPU usage info
    const cpus = os.cpus();
    const numCpus = cpus.length;
    
    // Calculate CPU load
    const loadAvg = os.loadavg();
    const loadPercentage = (loadAvg[0] / numCpus) * 100;
    
    // Log CPU load
    await writeLog(`CPU Load: ${loadPercentage.toFixed(2)}% (${loadAvg[0].toFixed(2)} / ${numCpus} cores)`);
    
    // Alert if CPU load is high
    if (loadPercentage > ALERT_THRESHOLD_CPU) {
      await writeLog(`⚠️ WARNING: High CPU usage detected: ${loadPercentage.toFixed(2)}%`);
      return {
        status: 'warning',
        message: `High CPU usage: ${loadPercentage.toFixed(2)}%`
      };
    }
    
    return {
      status: 'ok',
      message: `CPU usage normal: ${loadPercentage.toFixed(2)}%`
    };
  } catch (error) {
    await writeLog(`Error checking CPU usage: ${error.message}`);
    return {
      status: 'error',
      message: `Error checking CPU: ${error.message}`
    };
  }
}

// Check memory usage
async function checkMemoryUsage() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    // Convert to human-readable format
    const totalGB = (totalMemory / 1024 / 1024 / 1024).toFixed(2);
    const usedGB = (usedMemory / 1024 / 1024 / 1024).toFixed(2);
    
    // Log memory usage
    await writeLog(`Memory Usage: ${memoryPercentage.toFixed(2)}% (${usedGB}GB / ${totalGB}GB)`);
    
    // Alert if memory usage is high
    if (memoryPercentage > ALERT_THRESHOLD_MEMORY) {
      await writeLog(`⚠️ WARNING: High memory usage detected: ${memoryPercentage.toFixed(2)}%`);
      return {
        status: 'warning',
        message: `High memory usage: ${memoryPercentage.toFixed(2)}%`
      };
    }
    
    return {
      status: 'ok',
      message: `Memory usage normal: ${memoryPercentage.toFixed(2)}%`
    };
  } catch (error) {
    await writeLog(`Error checking memory usage: ${error.message}`);
    return {
      status: 'error',
      message: `Error checking memory: ${error.message}`
    };
  }
}

// Check disk usage
async function checkDiskUsage() {
  try {
    // Use df to get disk usage
    let command;
    
    if (process.platform === 'win32') {
      // Windows command
      command = 'wmic logicaldisk get size,freespace,caption';
    } else {
      // Linux/Mac command
      command = 'df -h /';
    }
    
    const { stdout } = await execPromise(command);
    
    // Parse the output
    let diskPercentage = 0;
    let diskInfo = '';
    
    if (process.platform === 'win32') {
      // Parse Windows output
      const lines = stdout.trim().split('\n');
      const dataLine = lines.find(line => line.includes('C:'));
      
      if (dataLine) {
        const parts = dataLine.trim().split(/\s+/);
        const freeSpace = parseInt(parts[1], 10);
        const totalSize = parseInt(parts[0], 10);
        const usedSpace = totalSize - freeSpace;
        
        diskPercentage = (usedSpace / totalSize) * 100;
        const freeGB = (freeSpace / 1024 / 1024 / 1024).toFixed(2);
        const totalGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
        
        diskInfo = `${diskPercentage.toFixed(2)}% (${freeGB}GB free of ${totalGB}GB)`;
      }
    } else {
      // Parse Linux/Mac output
      const lines = stdout.trim().split('\n');
      const dataLine = lines[1]; // Second line contains the data
      const parts = dataLine.trim().split(/\s+/);
      
      // Extract usage percentage
      const usagePercentage = parts[4];
      diskPercentage = parseInt(usagePercentage, 10);
      diskInfo = `${parts[4]} (${parts[3]} used of ${parts[1]} total)`;
    }
    
    // Log disk usage
    await writeLog(`Disk Usage: ${diskInfo}`);
    
    // Alert if disk usage is high
    if (diskPercentage > ALERT_THRESHOLD_DISK) {
      await writeLog(`⚠️ WARNING: High disk usage detected: ${diskPercentage}%`);
      return {
        status: 'warning',
        message: `High disk usage: ${diskPercentage}%`
      };
    }
    
    return {
      status: 'ok',
      message: `Disk usage normal: ${diskPercentage}%`
    };
  } catch (error) {
    await writeLog(`Error checking disk usage: ${error.message}`);
    return {
      status: 'error',
      message: `Error checking disk: ${error.message}`
    };
  }
}

// Check database connectivity
async function checkDatabase() {
  if (!DB_URL) {
    await writeLog('DATABASE_URL not set, skipping database check');
    return {
      status: 'skip',
      message: 'DATABASE_URL not set'
    };
  }
  
  try {
    // Try to parse the URL to extract the necessary info
    const pattern = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const matches = DB_URL.match(pattern);
    
    if (!matches) {
      await writeLog('Invalid database URL format');
      return {
        status: 'error',
        message: 'Invalid database URL format'
      };
    }
    
    const [, user, password, host, port, database] = matches;
    
    // Set environment variables for psql
    const env = {
      PGUSER: user,
      PGPASSWORD: password,
      PGHOST: host,
      PGPORT: port,
      PGDATABASE: database
    };
    
    // Check database connectivity with a simple query
    const startTime = Date.now();
    await execPromise('psql -c "SELECT 1"', { env });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    await writeLog(`Database connection successful (response time: ${responseTime}ms)`);
    
    // Check database size
    const { stdout } = await execPromise(
      'psql -c "SELECT pg_size_pretty(pg_database_size(current_database())) as size"',
      { env }
    );
    
    const sizeMatch = stdout.match(/^\s*size\s*\n\s*-+\s*\n\s*(.+?)\s*\n/m);
    if (sizeMatch) {
      await writeLog(`Database size: ${sizeMatch[1]}`);
    }
    
    return {
      status: 'ok',
      message: `Database connection successful (${responseTime}ms)`
    };
  } catch (error) {
    await writeLog(`⚠️ ERROR: Database connection failed: ${error.message}`);
    return {
      status: 'error',
      message: `Database connection failed: ${error.message}`
    };
  }
}

// Check Redis connectivity if configured
async function checkRedis() {
  if (!REDIS_URL) {
    await writeLog('REDIS_URL not set, skipping Redis check');
    return {
      status: 'skip',
      message: 'REDIS_URL not set'
    };
  }
  
  try {
    // Dynamically import Redis client to avoid issues when Redis is not available
    const Redis = require('ioredis');
    
    const startTime = Date.now();
    const redis = new Redis(REDIS_URL, { 
      connectTimeout: 2000,
      maxRetriesPerRequest: 1
    });
    
    // Ping Redis
    await redis.ping();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Get Redis info
    const info = await redis.info();
    const memoryMatch = info.match(/used_memory_human:(.+?)\r\n/);
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';
    
    await writeLog(`Redis connection successful (response time: ${responseTime}ms, memory usage: ${memoryUsage})`);
    
    // Close the connection
    await redis.quit();
    
    return {
      status: 'ok',
      message: `Redis connection successful (${responseTime}ms)`
    };
  } catch (error) {
    await writeLog(`⚠️ ERROR: Redis connection failed: ${error.message}`);
    return {
      status: 'error',
      message: `Redis connection failed: ${error.message}`
    };
  }
}

// Check network connectivity
async function checkNetwork() {
  try {
    // Ping Google DNS to check internet connectivity
    const command = process.platform === 'win32' ? 'ping -n 1 8.8.8.8' : 'ping -c 1 8.8.8.8';
    const { stdout } = await execPromise(command);
    
    // Parse ping time
    let pingTime;
    if (process.platform === 'win32') {
      const match = stdout.match(/Average = (\d+)ms/);
      pingTime = match ? match[1] : 'unknown';
    } else {
      const match = stdout.match(/time=(\d+\.\d+) ms/);
      pingTime = match ? match[1] : 'unknown';
    }
    
    await writeLog(`Network connectivity OK (ping time: ${pingTime}ms)`);
    
    return {
      status: 'ok',
      message: `Network connectivity OK (${pingTime}ms)`
    };
  } catch (error) {
    await writeLog(`⚠️ ERROR: Network connectivity check failed: ${error.message}`);
    return {
      status: 'error',
      message: `Network connectivity check failed: ${error.message}`
    };
  }
}

// Main function
async function main() {
  try {
    await ensureLogDir();
    
    await writeLog('--- Starting System Health Check ---');
    
    // Run all checks
    const cpuStatus = await checkCpuUsage();
    const memoryStatus = await checkMemoryUsage();
    const diskStatus = await checkDiskUsage();
    const dbStatus = await checkDatabase();
    const redisStatus = await checkRedis();
    const networkStatus = await checkNetwork();
    
    // Summarize results
    await writeLog('--- System Health Summary ---');
    
    const statuses = [
      { name: 'CPU', ...cpuStatus },
      { name: 'Memory', ...memoryStatus },
      { name: 'Disk', ...diskStatus },
      { name: 'Database', ...dbStatus },
      { name: 'Redis', ...redisStatus },
      { name: 'Network', ...networkStatus }
    ];
    
    for (const status of statuses) {
      const statusIcon = status.status === 'ok' ? '✅' : 
                          status.status === 'warning' ? '⚠️' : 
                          status.status === 'skip' ? '⏭️' : '❌';
      
      await writeLog(`${statusIcon} ${status.name}: ${status.message}`);
    }
    
    // Calculate overall system health
    const criticalErrors = statuses.filter(s => s.status === 'error' && s.name !== 'Redis').length;
    const warnings = statuses.filter(s => s.status === 'warning').length;
    
    let overallHealth;
    if (criticalErrors > 0) {
      overallHealth = 'CRITICAL - System has errors that need immediate attention';
    } else if (warnings > 0) {
      overallHealth = 'WARNING - System has potential issues to address';
    } else {
      overallHealth = 'HEALTHY - All systems operating normally';
    }
    
    await writeLog(`Overall System Health: ${overallHealth}`);
    await writeLog('--- System Health Check Complete ---');
    
  } catch (error) {
    console.error(`System monitoring failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 