#!/usr/bin/env node

/**
 * Database vacuum and analyze script
 * 
 * This script performs VACUUM and ANALYZE operations on the PostgreSQL database
 * to reclaim storage space and update statistics for the query planner
 * 
 * Usage:
 *   node database-vacuum.js
 * 
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection URL (required)
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Use promisified versions of Node.js functions
const execPromise = util.promisify(exec);

// Configuration from environment variables
require('dotenv').config();
const DB_URL = process.env.DATABASE_URL;

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

// Perform VACUUM ANALYZE
async function vacuumAnalyze() {
  if (!DB_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const dbConfig = parseDatabaseUrl(DB_URL);
  
  console.log(`Starting VACUUM ANALYZE on database ${dbConfig.database}...`);
  
  // Set environment variables for psql
  const env = {
    PGUSER: dbConfig.user,
    PGPASSWORD: dbConfig.password,
    PGHOST: dbConfig.host,
    PGPORT: dbConfig.port,
    PGDATABASE: dbConfig.database
  };
  
  try {
    // Run vacuum analyze
    const { stdout, stderr } = await execPromise(
      'psql -c "VACUUM ANALYZE;"', 
      { env }
    );
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.error(`Error during VACUUM ANALYZE: ${stderr}`);
    } else {
      console.log(`VACUUM ANALYZE completed successfully`);
    }
    
    // Get table sizes before and after
    const { stdout: sizeInfo } = await execPromise(
      'psql -c "SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;"',
      { env }
    );
    
    console.log(`Database size after vacuum: ${sizeInfo.trim().split('\n')[2].trim()}`);
    
  } catch (error) {
    console.error(`Error executing VACUUM ANALYZE: ${error.message}`);
    process.exit(1);
  }
}

// Check database statistics
async function checkDatabaseStats() {
  if (!DB_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const dbConfig = parseDatabaseUrl(DB_URL);
  
  // Set environment variables for psql
  const env = {
    PGUSER: dbConfig.user,
    PGPASSWORD: dbConfig.password,
    PGHOST: dbConfig.host,
    PGPORT: dbConfig.port,
    PGDATABASE: dbConfig.database
  };
  
  try {
    // Get database statistics
    console.log('Fetching database statistics...');
    
    // Get table statistics
    const { stdout: tableStats } = await execPromise(
      `psql -c "SELECT schemaname, relname, n_live_tup, n_dead_tup, 
      CASE WHEN n_live_tup > 0 THEN round(100 * n_dead_tup / n_live_tup, 2) ELSE 0 END AS dead_ratio 
      FROM pg_stat_user_tables 
      WHERE n_live_tup > 0 
      ORDER BY n_dead_tup DESC LIMIT 10;"`,
      { env }
    );
    
    console.log('Top tables by dead tuples:');
    console.log(tableStats);
    
    // Get index statistics
    const { stdout: indexStats } = await execPromise(
      `psql -c "SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC LIMIT 10;"`,
      { env }
    );
    
    console.log('Top indexes by usage:');
    console.log(indexStats);
    
  } catch (error) {
    console.error(`Error checking database statistics: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    // Get database stats before vacuum
    await checkDatabaseStats();
    
    // Perform vacuum analyze
    await vacuumAnalyze();
    
    // Get database stats after vacuum
    await checkDatabaseStats();
    
    console.log('Database maintenance completed successfully');
  } catch (error) {
    console.error(`Database maintenance failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(); 