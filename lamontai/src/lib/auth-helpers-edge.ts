/**
 * Edge-compatible authentication utilities
 * This module provides authentication functionality that works in Edge Runtime
 * without relying on Node.js-specific modules like bcryptjs
 */

import * as jose from 'jose';

/**
 * Verifies a password for Edge environments
 * Note: In Edge Runtime, we use a simpler comparison instead of bcrypt
 * This is less secure but allows the code to run in Edge Runtime
 * 
 * In production, you would want to use a more secure method like:
 * 1. Using WebCrypto API with PBKDF2 
 * 2. Calling a service worker or API endpoint that can use bcrypt
 * 3. Using a standalone WebAssembly implementation of bcrypt
 */
export async function verifyPasswordEdge(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // Safety check
  if (!plainPassword || !hashedPassword) return false;
  
  try {
    // Check if it's an edge hash with our prefix (created in server-auth-utils.ts)
    if (hashedPassword.startsWith('edge:')) {
      // Use safer string operations instead of split
      // Original: const [salt, storedHash] = hashedPassword.split(':');
      
      const firstColonIndex = hashedPassword.indexOf(':');
      if (firstColonIndex < 0) return false;
      
      const secondColonIndex = hashedPassword.indexOf(':', firstColonIndex + 1);
      if (secondColonIndex < 0) return false;
      
      const salt = hashedPassword.substring(firstColonIndex + 1, secondColonIndex);
      const storedHash = hashedPassword.substring(secondColonIndex + 1);
      
      if (!salt || !storedHash) return false;
      
      // Create a hash from the plain password using the stored salt
      const encoder = new TextEncoder();
      const data = encoder.encode(plainPassword + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Compare the computed hash with the stored hash
      return hashHex === storedHash;
    }
    
    // For development purposes only - not secure!
    // Check if the password is the development test password
    if (process.env.NODE_ENV === 'development') {
      return plainPassword === 'password123' && 
        (hashedPassword === 'dev_hash_1' || hashedPassword === 'dev_hash_2');
    }
    
    console.error('Cannot verify bcrypt hashes in Edge Runtime');
    return false;
  } catch (error) {
    console.error('Edge password verification error:', error);
    return false;
  }
}

/**
 * Creates a password hash compatible with Edge Runtime
 */
export async function hashPasswordEdge(password: string): Promise<string> {
  try {
    // Use Web Crypto API which is available in Edge Runtime
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
      return `${salt}:${hashHex}`;
    }
    
    // Fallback for development (NOT FOR PRODUCTION USE)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Edge password hashing error:', error);
    throw new Error('Failed to hash password in Edge Runtime');
  }
}

/**
 * Validates a password against security requirements
 */
export function validatePasswordEdge(password: string): { isValid: boolean; message?: string } {
  // Check password length
  if (!password || typeof password !== 'string') {
    return { 
      isValid: false, 
      message: 'Password must be a valid string' 
    };
  }
  
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one number' 
    };
  }

  // Password is valid
  return { isValid: true };
}

/**
 * Generate JWT token using jose (Edge compatible)
 */
export async function generateTokenEdge(payload: { id: string; email: string; role: string }): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  const alg = 'HS256';
  
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
    
  return jwt;
}

/**
 * Verify JWT token using jose (Edge compatible)
 */
export async function verifyJWTEdge(token: string): Promise<any> {
  if (!token) {
    throw new Error('No token provided');
  }
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  try {
    const { payload } = await jose.jwtVerify(token, encodedSecret, {
      algorithms: ['HS256']
    });
    
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new Error('Invalid or expired token');
  }
} 