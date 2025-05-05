/**
 * Biometric to DID Conversion Utility
 * 
 * This file implements the process flow from capturing biometric data (specifically fingerprints)
 * to creating a blockchain-based digital identity using DID:key methodology as described in
 * the from-fingerprint-to-blockchainIdentity.md documentation.
 */

import { sha256 } from "@noble/hashes/sha256";
import { ed25519 } from "@noble/curves/ed25519";
import { base58btc } from "multiformats/bases/base58";

/**
 * Helper function to convert Uint8Array to hex string
 * This replaces the Buffer.from().toString('hex') call with a browser-compatible solution
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * STEP 1: Extract Template (e.g., ANSI-378)
 * 
 * This function uses the standardized ISO template from the backend API.
 * The ISO template is mandatory - no fallback to raw fingerprint data.
 * 
 * @param {Object} fingerprintTemplate - The fingerprint template object with ISO data
 * @returns {Uint8Array} Binary representation of the ISO template
 * @throws {Error} If ISO template is not available
 */
export const extractTemplate = (fingerprintTemplate) => {
  console.log("STEP 1: Extracting standardized ISO template from fingerprint data");
  
  // Check if template has the expected structure
  if (!fingerprintTemplate) {
    throw new Error("Invalid fingerprint template structure - template object is null or undefined");
  }
  
  // ISO template is mandatory - check if it exists
  if (!fingerprintTemplate.iso_template_base64) {
    console.error("Missing ISO template in fingerprint data", fingerprintTemplate);
    throw new Error("ISO template is mandatory but not available in the fingerprint data");
  }
  
  console.log("ISO template found - processing standardized biometric data");
  
  try {
    // Convert base64 ISO template to binary
    const binaryString = window.atob(fingerprintTemplate.iso_template_base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log(`ISO template successfully processed: ${bytes.length} bytes of standardized data`);
    console.log(`ISO template format: ISO/IEC 19794-2 Finger Minutiae Record`);
    
    // Check if the template has the expected minimum size
    if (bytes.length < 10) {
      console.error("ISO template is too small, possibly corrupted");
      throw new Error("Invalid ISO template: insufficient data");
    }
    
    // Log first few bytes as hexadecimal for debugging (format identifier)
    const formatBytes = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`ISO template format identifier bytes: ${formatBytes}`);
    
    return bytes;
  } catch (error) {
    console.error("Error converting ISO template:", error);
    throw new Error(`Failed to process ISO template: ${error.message}`);
  }
};

/**
 * STEP 2: Apply Cancelable Biometrics or Fuzzy Extractor
 * 
 * Since biometric templates vary slightly with each scan, we need to apply
 * techniques to get a stable output from similar inputs.
 * 
 * In production, this would use a proper fuzzy extractor library.
 * For this implementation, we'll simulate a simple transformation.
 * 
 * @param {Uint8Array} templateData - Binary template data
 * @param {string} userId - User's identifier to mix with template
 * @returns {Uint8Array} Stabilized biometric data
 */
export const applyBiometricStabilization = (templateData, userId) => {
  console.log("STEP 2: Applying biometric stabilization technique");
  
  // In production: Use a proper fuzzy extractor or cancelable biometrics library
  // For this implementation: Use a salting approach with the user's ID to add stability
  
  // Create a salt using the user ID
  const encoder = new TextEncoder();
  const salt = encoder.encode(userId || "default-user");
  
  // Combine the template with the salt
  const combinedData = new Uint8Array(templateData.length + salt.length);
  combinedData.set(templateData);
  combinedData.set(salt, templateData.length);
  
  return combinedData;
};

/**
 * STEP 3: Generate Stable Secret Key
 * 
 * This function takes the stabilized biometric data and creates a
 * stable secret key that can be consistently regenerated.
 * 
 * @param {Uint8Array} stabilizedData - The stabilized biometric data
 * @returns {Uint8Array} A stable secret key
 */
export const generateStableSecretKey = (stabilizedData) => {
  console.log("STEP 3: Generating stable secret key");
  
  // For production: Apply additional transformations as needed
  // For this implementation: The stabilized data is our key material
  
  // Ensure the data is of sufficient length and quality for cryptographic use
  if (stabilizedData.length < 32) {
    throw new Error("Insufficient biometric data for secure key generation");
  }
  
  // Return the first 32 bytes as our stable secret key
  return stabilizedData.slice(0, 32);
};

/**
 * STEP 4: Hash the Stable Secret
 * 
 * Apply a cryptographic hash function to the stable secret
 * to ensure it has the right properties for key generation.
 * 
 * @param {Uint8Array} stableSecret - The stable secret key
 * @returns {Uint8Array} Cryptographic hash of the secret
 */
export const hashStableSecret = (stableSecret) => {
  console.log("STEP 4: Applying SHA-256 hash to the stable secret");
  
  // Apply SHA-256 to get a deterministic 32-byte output
  return sha256(stableSecret);
};

/**
 * STEP 5 & 6: Derive Cryptographic Keypair
 * 
 * Generate a private and public key pair from the hashed secret
 * using Ed25519 elliptic curve cryptography.
 * 
 * @param {Uint8Array} hashedSecret - The hashed stable secret
 * @returns {Object} An object containing private and public keys
 */
export const deriveKeyPair = (hashedSecret) => {
  console.log("STEP 5 & 6: Deriving private and public keys using Ed25519");
  
  // Use the hashed secret as the private key seed
  // Ed25519 expects a 32-byte seed for the private key
  const privateKey = hashedSecret.slice(0, 32);
  
  // Generate public key from private key using the correct ed25519 function
  // The privateKey is used as the seed to generate both private and public key components
  const publicKey = ed25519.getPublicKey(privateKey);
  
  return {
    privateKey,
    publicKey
  };
};

/**
 * STEP 7: Generate DID:key from Public Key
 * 
 * Convert the public key to a W3C DID:key format.
 * 
 * @param {Uint8Array} publicKey - The Ed25519 public key
 * @returns {string} The DID in did:key format
 */
export const generateDIDKey = (publicKey) => {
  console.log("STEP 7: Generating DID:key from the public key");
  
  // Add the multicodec prefix for Ed25519 (0xed01)
  const ed25519Prefix = new Uint8Array([0xed, 0x01]);
  const prefixedKey = new Uint8Array(ed25519Prefix.length + publicKey.length);
  prefixedKey.set(ed25519Prefix);
  prefixedKey.set(publicKey, ed25519Prefix.length);
  
  // Encode the prefixed key using base58btc
  const multibaseEncoded = base58btc.encode(prefixedKey);
  
  // Return the final DID in the format: did:key:{base58btc-encoded-key}
  return `did:key:${multibaseEncoded}`;
};

/**
 * Complete Biometric to DID Conversion Process
 * 
 * This function implements the full workflow:
 * Fingerprint → Template → Stabilization → Secret Key → Hash → 
 * Key Pair → DID:key
 * 
 * @param {Object} fingerprintTemplate - The fingerprint template object
 * @param {string} userId - User's identifier (national ID)
 * @returns {Object} Contains DID, private key, and public key
 */
export const biometricToDID = (fingerprintTemplate, userId) => {
  console.log("Starting biometric to DID conversion process...");
  
  // Step 1: Extract template features
  const templateData = extractTemplate(fingerprintTemplate);
  
  // Step 2: Apply biometric stabilization
  const stabilizedData = applyBiometricStabilization(templateData, userId);
  
  // Step 3: Generate stable secret key
  const stableSecret = generateStableSecretKey(stabilizedData);
  
  // Step 4: Hash the stable secret
  const hashedSecret = hashStableSecret(stableSecret);
  
  // Step 5 & 6: Derive cryptographic key pair
  const { privateKey, publicKey } = deriveKeyPair(hashedSecret);
  
  // Step 7: Generate DID:key
  const didKey = generateDIDKey(publicKey);
  
  // Convert binary keys to hex strings for storage and display using our browser-compatible function
  const result = {
    didKey,
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey)
  };
  
  console.log("✅ Biometric to DID conversion completed successfully");
  
  return result;
};

export default biometricToDID;