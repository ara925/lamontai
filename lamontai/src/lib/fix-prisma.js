/**
 * Prisma client fix for Windows environments
 * This script copies the Prisma query engine files to the appropriate location
 * Run this script before building the application:
 * node src/lib/fix-prisma.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to Prisma engines
const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
const binariesDir = path.join(prismaDir, 'query-engine-windows.dll.node');
const targetDir = path.join(process.cwd(), '.next', 'server');

console.log('Fixing Prisma for Windows environment...');

// Create directories if they don't exist
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Copy query engine file to target directory
function copyPrismaEngineFiles() {
  try {
    // Check if Prisma engine exists
    if (!fs.existsSync(binariesDir)) {
      console.log('Prisma engine not found. Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
    }

    // Ensure target directory exists
    ensureDirExists(targetDir);

    // Copy engine files
    const files = fs.readdirSync(prismaDir);
    let enginesCopied = 0;

    for (const file of files) {
      if (file.includes('query-engine') || file.includes('schema.prisma')) {
        const source = path.join(prismaDir, file);
        const target = path.join(targetDir, file);
        
        fs.copyFileSync(source, target);
        console.log(`Copied ${file} to ${targetDir}`);
        enginesCopied++;
      }
    }

    if (enginesCopied > 0) {
      console.log(`Successfully copied ${enginesCopied} Prisma engine files`);
    } else {
      console.warn('No Prisma engine files found to copy');
    }
  } catch (error) {
    console.error('Error copying Prisma engine files:', error);
  }
}

// Main execution
copyPrismaEngineFiles();
console.log('Prisma fix completed'); 