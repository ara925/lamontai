/**
 * Edge-compatible crypto utilities
 * 
 * This file provides crypto functions that work in both Node.js and Edge Runtime
 * by using the Web Crypto API which is available in all modern environments
 */

// Utility function to convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Utility function to convert Uint8Array to hex string
function uint8ArrayToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// Generate a random UUID (v4)
export function randomUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers and recent Node.js)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation using getRandomValues
  const rnds = new Uint8Array(16);
  crypto.getRandomValues(rnds);
  
  // Set version (4) and variant (RFC4122)
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;
  
  // Convert to hex string with hyphens in the standard positions
  const hex = uint8ArrayToHex(rnds);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-');
}

// Generate a random bytes buffer
export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

// Hash data using SHA-256 (returns hex string)
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC using SHA-256
export async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);
  
  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the data
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// AES-GCM Encryption
export async function encrypt(plaintext: string, key: string): Promise<string> {
  // Derive a key from the passphrase
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(key)
  );
  
  // Import the key for encryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Create initialization vector
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(plaintext)
  );
  
  // Combine IV and encrypted data
  const encryptedArray = new Uint8Array(iv.length + encryptedData.byteLength);
  encryptedArray.set(iv);
  encryptedArray.set(new Uint8Array(encryptedData), iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...encryptedArray));
}

// AES-GCM Decryption
export async function decrypt(ciphertext: string, key: string): Promise<string> {
  // Convert from base64
  const encryptedData = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  // Extract IV (first 12 bytes)
  const iv = encryptedData.slice(0, 12);
  const data = encryptedData.slice(12);
  
  // Derive the key from the passphrase
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(key)
  );
  
  // Import the key for decryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// Export a simple API compatible with common crypto usage
export default {
  randomUUID,
  randomBytes,
  sha256,
  hmacSha256,
  encrypt,
  decrypt
}; 