import { compare, hash } from 'bcryptjs';

/**
 * Verifies a password against a hashed value
 * @param plainPassword The plain text password to verify
 * @param hashedPassword The hashed password to compare against
 * @returns A promise resolving to true if the password matches, false otherwise
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generates a hash from a password
 * @param password The plain text password to hash
 * @returns A promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Use 12 rounds for better security-performance balance
    return await hash(password, 12);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Validates a password against common security requirements
 * @param password The password to validate
 * @returns An object with validation result and optional error message
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  // Check password length
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