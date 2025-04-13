/**
 * Server-side utility functions for authentication
 * Only import this in Server Components or API routes
 */

import { db } from "./db";
import { compare, hash } from "bcryptjs";
// import { sign, verify } from "jsonwebtoken"; // Remove jsonwebtoken
import * as jose from 'jose'; // Import jose
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Encode the JWT secret
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const alg = 'HS256'; // Define the algorithm

// Type for the JWT payload
interface JWTPayload extends jose.JWTPayload {
  id: string;
  email: string;
  role: string;
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// Verify a password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  console.log(`DEBUG verifyPassword: Comparing plaintext (length ${password.length}) with hash: ${hashedPassword}`);
  const isMatch = await compare(password, hashedPassword);
  console.log(`DEBUG verifyPassword: Result is ${isMatch}`);
  return isMatch;
}

// Get JWT token from cookies
export function getToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get("token")?.value || null;
}

// Verify JWT token and return payload using jose
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  // console.log(`DEBUG: verifyToken called. Token length: ${token?.length}`); // Remove debug log
  try {
    if (!token || token.length < 20) {
      console.log('SERVER: Invalid token (too short or empty)');
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('SERVER: JWT_SECRET environment variable is not set');
      return null;
    }
    const encodedSecret = new TextEncoder().encode(jwtSecret);
    
    // console.log(`SERVER: Verifying token with secret length: ${jwtSecret.length}`);
    
    // console.log("DEBUG: Attempting jose.jwtVerify()..."); // Remove debug log
    const { payload } = await jose.jwtVerify(token, encodedSecret, {
      algorithms: [alg]
    });
    // console.log("DEBUG: jose.jwtVerify() successful."); // Remove debug log
    
    const decoded = payload as JWTPayload;

    // Check if token has required fields
    if (!decoded.id || !decoded.email) {
      console.log('SERVER: Token missing required fields');
      return null;
    }
    
    // console.log(`SERVER: Token verified successfully for user: ${decoded.email}`);
    return decoded;
  } catch (error) {
    console.error('SERVER: Token verification error:', error instanceof Error ? error.message : String(error));
    // console.error("DEBUG: Error occurred within verifyToken catch block."); // Remove debug log
    return null;
  }
}

// Similar to verifyToken but throws errors instead of returning null using jose
export async function verifyJWT(token: string): Promise<JWTPayload> {
  if (!token || token.length < 20) {
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
      algorithms: [alg]
    });
    
    const decoded = payload as JWTPayload;

    // Check if token has required fields
    if (!decoded.id || !decoded.email) {
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

// Generate JWT token using jose
export async function generateToken(payload: { id: string; email: string; role: string }): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d') // Set expiration time
    .sign(encodedSecret);
    
  return jwt;
  // Old jsonwebtoken: return sign(payload, jwtSecret, { expiresIn: '7d' });
}

// Get the current user from the token in cookies
export async function getCurrentUser() {
  // console.log("DEBUG: getCurrentUser called."); // Remove debug log
  const token = getToken();
  // console.log(`DEBUG: getCurrentUser - Token from getToken(): ${token ? 'Exists' : 'null'}`); // Remove debug log
  
  if (!token) return null;
  
  // console.log("DEBUG: getCurrentUser - Calling verifyToken..."); // Remove debug log
  const payload = await verifyToken(token); // Await the async verifyToken
  // console.log(`DEBUG: getCurrentUser - Payload from verifyToken: ${payload ? JSON.stringify(payload) : 'null'}`); // Remove debug log
  
  if (!payload) return null;
  
  try {
    const user = await db.user.findUnique({
      where: { id: payload.id }
    });
    
    if (user) {
      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

// Helper function to get the user ID from token (for API routes)
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    console.debug("getUserIdFromRequest: No token found in cookies");
    
    // Try fallback: Check authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const headerToken = authHeader.substring(7);
      console.debug("getUserIdFromRequest: Found token in Authorization header");
      
      try {
        const payload = await verifyToken(headerToken);
        return payload?.id || null;
      } catch (error) {
        console.error("getUserIdFromRequest: Invalid token in Authorization header:", error);
        return null;
      }
    }
    
    return null;
  }
  
  try {
    const payload = await verifyToken(token);
    return payload?.id || null;
  } catch (error) {
    console.error("getUserIdFromRequest: Error verifying token from cookies:", error);
    return null;
  }
} 