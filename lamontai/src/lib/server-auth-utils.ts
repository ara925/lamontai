/**
 * Server-side utility functions for authentication
 * Contains functions compatible with both Node.js and Edge runtimes WHERE NOTED.
 * Password hashing/verification here uses Edge-compatible methods ONLY.
 * For Node.js specific password handling (bcryptjs), use node-auth-utils.ts
 */

import { getDatabaseClient } from "./db"; // Import the getter function
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import * as jose from 'jose'; // Import jose for Edge-compatible JWT handling

// Type for the JWT payload
interface JWTPayload extends jose.JWTPayload {
  id: string;
  email: string;
  role: string;
}

// Edge-compatible password hashing implementation
// IMPORTANT: This SHA-256 implementation is NOT as secure as bcrypt.
// Consider replacing with a stronger KDF like PBKDF2 via WebCrypto if possible,
// or delegate password handling to a dedicated auth service or Node.js backend endpoint.
async function edgeCompatibleHash(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Generate a random salt
      const saltArray = crypto.getRandomValues(new Uint8Array(16));
      const salt = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Hash the password with the salt
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Return as salt:hash
      return `edge:${salt}:${hashHex}`;
    }
    
    throw new Error('Crypto API not available in this environment');
  } catch (error) {
    console.error('Edge password hashing error:', error);
    throw new Error('Failed to hash password in Edge Runtime');
  }
}

// Edge-compatible password comparison implementation
async function edgeCompatibleCompare(plaintext: string, hash: string): Promise<boolean> {
  try {
    // Check if it's an edge hash
    if (hash.startsWith('edge:')) {
      // Use safer string operations instead of split
      // Original: const [prefix, salt, storedHash] = hash.split(':');
      
      const firstColonIndex = hash.indexOf(':');
      if (firstColonIndex < 0) return false;
      
      const secondColonIndex = hash.indexOf(':', firstColonIndex + 1);
      if (secondColonIndex < 0) return false;
      
      const prefix = hash.substring(0, firstColonIndex);
      const salt = hash.substring(firstColonIndex + 1, secondColonIndex);
      const storedHash = hash.substring(secondColonIndex + 1);
      
      if (!salt || !storedHash) {
        console.error('Invalid password hash format');
        return false;
      }
      
      // Convert the password to a hash using the same salt
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Compare the computed hash with the stored hash
      return hashHex === storedHash;
    }
    
    // This function now ONLY handles edge-compatible hashes
    console.error('Cannot verify non-edge hashes with edgeCompatibleCompare.');
    // If a non-edge hash is passed here, it indicates a logic error elsewhere.
    return false;
  } catch (error) {
    console.error('Edge password verification error:', error);
    return false;
  }
}

// Hash a password (NOW ALWAYS USES EDGE-COMPATIBLE HASHING)
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password format');
  }
  // Note: Second argument (rounds) is ignored by edgeCompatibleHash
  return edgeCompatibleHash(password);
}

// Verify a password (NOW ALWAYS USES EDGE-COMPATIBLE COMPARISON)
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword || typeof password !== 'string' || typeof hashedPassword !== 'string') {
    console.error('Invalid password or hash format');
    return false;
  }
  
  try {
    // Directly use the edge-compatible comparison function
    return await edgeCompatibleCompare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Get JWT token from cookies (Edge compatible)
export function getToken(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get("token")?.value || null;
  } catch (error) {
    console.error('Error getting token from cookies:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Verify JWT token and return payload using jose (Edge compatible)
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    if (!token || typeof token !== 'string' || token.length < 20) {
      console.log('SERVER: Invalid token (too short or empty)');
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('SERVER: JWT_SECRET environment variable is not set');
      return null;
    }
    const encodedSecret = new TextEncoder().encode(jwtSecret);
    
    const { payload } = await jose.jwtVerify(token, encodedSecret, {
      algorithms: ['HS256']
    });
    
    const decoded = payload as JWTPayload;

    // Check if token has required fields
    if (!decoded || !decoded.id || !decoded.email) {
      console.log('SERVER: Token missing required fields');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('SERVER: Token verification error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Similar to verifyToken but throws errors instead of returning null using jose (Edge compatible)
export async function verifyJWT(token: string): Promise<JWTPayload> {
  if (!token || typeof token !== 'string' || token.length < 20) {
    throw new Error('Invalid token format');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  try {
    // Will throw if invalid
    const { payload } = await jose.jwtVerify(token, encodedSecret, {
      algorithms: ['HS256']
    });
    
    const decoded = payload as JWTPayload;

    // Check if token has required fields
    if (!decoded || !decoded.id || !decoded.email) {
      throw new Error('Token missing required fields');
    }
    
    return decoded;
  } catch (error) {
    // Rethrow with more specific message
    if (error instanceof Error) {
      // Include known jose error types for better debugging
      if (error.name === 'JWTExpired' || error.name === 'JWTClaimValidationFailed' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWSInvalid') {
         throw new Error(`Token verification failed: ${error.name} - ${error.message}`);
      }
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error('Token verification failed');
  }
}

// Generate JWT token using jose (Edge compatible)
export async function generateToken(payload: { id: string; email: string; role: string }): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  try {
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Set expiration time
      .sign(encodedSecret);
      
    return jwt;
  } catch (error) {
    console.error('Token generation error:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to generate JWT token');
  }
}

// Get the current user from the token in cookies (Relies on db - check db usage)
export async function getCurrentUser() {
  const token = getToken();
  
  if (!token) return null;
  
  const payload = await verifyToken(token); // Await the async verifyToken
  
  if (!payload) return null;
  
  try {
    const db = await getDatabaseClient(); // Await the client instance
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    
    if (!user) {
      console.log(`SERVER: User not found for token payload ID: ${payload.id}`);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('SERVER: Error fetching user:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Helper function to get the user ID from token (Edge compatible)
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  if (!request || typeof request !== 'object') {
    console.error("getUserIdFromRequest: Invalid request object");
    return null;
  }
  
  try {
    // Try getting token from cookies
    let token: string | undefined;
    try {
      // More robust cookie handling with null checks
      const tokenCookie = request.cookies?.get?.('token');
      token = tokenCookie && typeof tokenCookie === 'object' ? tokenCookie.value : undefined;
      
      // Ensure token is a valid string
      if (token !== undefined && typeof token !== 'string') {
        console.debug("getUserIdFromRequest: Token is not a string");
        token = undefined;
      }
    } catch (e) {
      console.debug("getUserIdFromRequest: Error accessing cookies:", e instanceof Error ? e.message : String(e));
    }
    
    // Try fallback: Check authorization header if no cookie token
    if (!token) {
      try {
        // Extra safe header extraction with strict type checking
        const authHeader = request.headers?.get?.('Authorization');
        
        // Full defensive check before attempting any string operations
        if (authHeader && typeof authHeader === 'string' && authHeader.includes(' ')) {
          // Use indexOf and substring instead of split to avoid potential issues
          const bearerIndex = authHeader.indexOf(' ');
          const authType = authHeader.substring(0, bearerIndex);
          
          if (authType === 'Bearer' && bearerIndex < authHeader.length - 1) {
            token = authHeader.substring(bearerIndex + 1);
          }
        }
      } catch (e) {
        console.debug("getUserIdFromRequest: Error accessing authorization header:", e instanceof Error ? e.message : String(e));
      }
    }
    
    // No token found in either location
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    // Verify the token
    try {
      const payload = await verifyToken(token);
      return payload?.id || null;
    } catch (error) {
      console.error("getUserIdFromRequest: Error verifying token:", error instanceof Error ? error.message : String(error));
      return null;
    }
  } catch (error) {
    console.error("getUserIdFromRequest: Unexpected error:", error instanceof Error ? error.message : String(error));
    return null;
  }
} 