/**
 * Lamontai Build Fix Script for Windows
 * This script helps fix the Prisma client issues in Windows environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to Prisma engines
const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
const targetDir = path.join(process.cwd(), '.next', 'server');

console.log('Starting Lamontai Windows build fix...');

// Create directories if they don't exist
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Regenerate Prisma client
function regeneratePrismaClient() {
  try {
    console.log('Regenerating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma client regenerated successfully');
  } catch (error) {
    console.error('Error regenerating Prisma client:', error);
  }
}

// Copy query engine file to target directory
function copyPrismaEngineFiles() {
  try {
    console.log('Checking for Prisma engine files...');
    
    // Check if Prisma client directory exists
    if (!fs.existsSync(prismaDir)) {
      console.log('Prisma client directory not found. Generating Prisma client...');
      regeneratePrismaClient();
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

// Fix the NextAuth implementation to avoid edge runtime issues
function fixNextAuthImplementation() {
  try {
    console.log('Checking NextAuth implementation...');
    
    // Path to NextAuth route file
    const nextAuthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
    
    if (fs.existsSync(nextAuthRoutePath)) {
      console.log('Found NextAuth route file, ensuring it uses Node.js runtime...');
      
      // Read the file content
      let content = fs.readFileSync(nextAuthRoutePath, 'utf8');
      
      // Make sure it specifies nodejs runtime
      if (!content.includes("export const runtime = 'nodejs'")) {
        content = content.replace(
          /import NextAuth from "next-auth";/,
          "import NextAuth from \"next-auth\";\n\n// Specify that we don't want edge runtime for this handler\nexport const runtime = 'nodejs';"
        );
        
        // Write the updated content back
        fs.writeFileSync(nextAuthRoutePath, content);
        console.log('Updated NextAuth route to use Node.js runtime');
      } else {
        console.log('NextAuth route already using Node.js runtime');
      }
    } else {
      console.log('NextAuth route file not found, no changes needed');
    }
  } catch (error) {
    console.error('Error fixing NextAuth implementation:', error);
  }
}

// Run the script
try {
  regeneratePrismaClient();
  copyPrismaEngineFiles();
  fixNextAuthImplementation();
  console.log('Build fix completed successfully!');
} catch (error) {
  console.error('Error running build fix:', error);
  process.exit(1);
} 