/**
 * Edge-compatible database client utilities
 * This provides optimized database access for Edge runtime
 */

import { PrismaClient } from '@prisma/client'

// Use a global prisma client to avoid connection issues in development
// This is a recommended pattern for Next.js applications

let prisma: PrismaClient | undefined

// For edge environments, we need to create a new client for each request
// to avoid connection pooling issues in serverless environments
export function getEdgePrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    // In production, create a new client for each request
    // This works better in serverless/edge environments
    return new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    })
  }
  
  // In development, reuse the client to avoid too many connections
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    })
  }

  return prisma
}

// Function to safely close a Prisma client connection
// Important in edge environments to prevent connection leaks
export async function closePrismaClient(client: PrismaClient) {
  if (process.env.NODE_ENV === 'production') {
    try {
      await client.$disconnect()
    } catch (e) {
      console.error('Error disconnecting from database:', e)
    }
  }
} 