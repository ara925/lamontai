/**
 * Edge-compatible authentication adapter for NextAuth
 * This provides a lightweight JWT-based auth system that works in Edge Runtime
 */

import type { Adapter, AdapterUser } from "next-auth/adapters";
import { getNeonPrismaClient } from '@/lib/prisma-cloudflare';
import { 
  generateJwtToken, 
  verifyJwtToken, 
  hashPasswordEdge,
  comparePasswordEdge 
} from './auth-utils-edge';

/**
 * Create a NextAuth adapter for Edge runtime
 */
export function EdgeAuthAdapter(): Adapter {
  return {
    // Create a user
    async createUser(user) {
      try {
        const prisma = await getNeonPrismaClient();
        
        // Hash the password if provided
        let hashedPassword = '';
        if ('password' in user && user.password) {
          hashedPassword = await hashPasswordEdge(user.password as string);
        }
        
        // Create the user in the database
        const newUser = await prisma.user.create({
          data: {
            name: user.name || '',
            email: user.email,
            password: hashedPassword,
            role: 'user',
          },
        });
        
        // Create default settings for the user
        await prisma.settings.create({
          data: {
            userId: newUser.id,
            theme: 'light',
            language: 'english',
            notifications: true,
          },
        });
        
        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          emailVerified: null,
        };
      } catch (error) {
        console.error("Error creating user:", error);
        throw error;
      }
    },

    // Get a user by their ID
    async getUser(id) {
      try {
        const prisma = await getNeonPrismaClient();
        const user = await prisma.user.findUnique({
          where: { id },
        });
        
        if (!user) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: null,
        };
      } catch (error) {
        console.error("Error getting user:", error);
        return null;
      }
    },

    // Get a user by their email
    async getUserByEmail(email) {
      try {
        const prisma = await getNeonPrismaClient();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        
        if (!user) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: null,
        };
      } catch (error) {
        console.error("Error getting user by email:", error);
        return null;
      }
    },

    // Get a user by their account
    async getUserByAccount({ providerAccountId, provider }) {
      try {
        // For JWT-based authentication, we don't use accounts
        // In a real implementation, you might want to store provider
        // info in a separate table
        return null;
      } catch (error) {
        console.error("Error getting user by account:", error);
        return null;
      }
    },

    // Update a user
    async updateUser(user) {
      try {
        const prisma = await getNeonPrismaClient();
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: user.name,
            email: user.email,
            // Don't update role or password here
          },
        });
        
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          emailVerified: null,
        };
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },

    // Methods below are not fully implemented as they're not needed
    // for a basic JWT authentication system
    // In a real implementation, you would want to implement these

    async deleteUser(userId) {
      // Deletion is disabled for security reasons
      throw new Error("User deletion not supported");
    },

    async linkAccount(account) {
      // Not implemented for JWT auth
      return account;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      // Not implemented for JWT auth
      return undefined;
    },

    async createSession({ sessionToken, userId, expires }) {
      // Instead of creating a session in the database,
      // generate a JWT token
      const token = await generateJwtToken({
        sub: userId,
        exp: Math.floor(expires.getTime() / 1000),
      });
      
      return {
        id: userId,
        sessionToken: token,
        userId,
        expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      try {
        // Verify the JWT token
        const payload = await verifyJwtToken(sessionToken);
        if (!payload || !payload.sub) return null;
        
        const userId = payload.sub as string;
        
        // Get the user
        const prisma = await getNeonPrismaClient();
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (!user) return null;
        
        // Calculate expiry from the token
        const expiryTime = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        return {
          session: {
            id: user.id,
            sessionToken,
            userId: user.id,
            expires: expiryTime,
          },
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: null,
          },
        };
      } catch (error) {
        console.error("Error getting session and user:", error);
        return null;
      }
    },

    async updateSession({ sessionToken, expires, userId }) {
      // Generate a new token with updated expiry
      const token = await generateJwtToken({
        sub: userId,
        exp: Math.floor((expires || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).getTime() / 1000),
      });
      
      return {
        id: userId || '',
        sessionToken: token,
        userId: userId || '',
        expires: expires || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    },

    async deleteSession(sessionToken) {
      // No need to delete JWT tokens as they're stateless
      return;
    },

    async createVerificationToken({ identifier, expires, token }) {
      // Not implemented for basic JWT auth
      throw new Error("Verification tokens not supported");
    },

    async useVerificationToken({ identifier, token }) {
      // Not implemented for basic JWT auth
      throw new Error("Verification tokens not supported");
    },
  };
}

/**
 * Verify a credential in Edge runtime
 * This is used for password-based authentication
 */
export async function verifyCredentialsEdge(email: string, password: string) {
  try {
    const prisma = await getNeonPrismaClient();
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) return null;
    
    // Compare the password
    const passwordsMatch = await comparePasswordEdge(password, user.password);
    
    if (!passwordsMatch) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return null;
  }
} 