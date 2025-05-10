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
 * Generate Voter DID directly from ISO template
 * 
 * For voters, we directly apply SHA-256 to the ISO template to create the DID,
 * without generating cryptographic keys.
 * 
 * @param {Uint8Array} templateData - The ISO template binary data
 * @returns {string} The DID in did:sha-256: format
 */
export const generateVoterDID = (templateData) => {
  console.log("Generating voter DID directly from ISO template");
  
  // Hash the template data with SHA-256
  const hashedTemplate = sha256(templateData);
  
  // Convert to hex string
  const didValue = bytesToHex(hashedTemplate);
  
  // Return the DID in a format that indicates it's a direct hash
  return `did:sha-256:${didValue}`;
};

/**
 * STEP 2: Generate Stable Secret Key
 * 
 * This function directly uses the deterministic ISO template data to create a
 * cryptographic key, since stabilization is already handled by the backend.
 * 
 * @param {Uint8Array} templateData - The ISO template binary data
 * @returns {Uint8Array} A stable secret key
 */
export const generateStableSecretKey = (templateData) => {
  console.log("STEP 2: Generating stable secret key directly from ISO template");
  
  // Ensure the data is of sufficient length and quality for cryptographic use
  if (templateData.length < 32) {
    throw new Error("Insufficient biometric data for secure key generation");
  }
  
  // For templates larger than 32 bytes, we hash them to get a fixed size
  if (templateData.length > 32) {
    // Use SHA-256 to create a fixed-size representation of the template
    return sha256(templateData);
  }
  
  // If exactly 32 bytes, use as is (unlikely but handled for completeness)
  return templateData;
};

/**
 * STEP 3: Hash the Stable Secret
 * 
 * Apply a cryptographic hash function to the stable secret
 * to ensure it has the right properties for key generation.
 * 
 * @param {Uint8Array} stableSecret - The stable secret key
 * @returns {Uint8Array} Cryptographic hash of the secret
 */
export const hashStableSecret = (stableSecret) => {
  console.log("STEP 3: Applying SHA-256 hash to the stable secret");
  
  // Apply SHA-256 to get a deterministic 32-byte output
  return sha256(stableSecret);
};

/**
 * STEP 4 & 5: Derive Cryptographic Keypair
 * 
 * Generate a private and public key pair from the hashed secret
 * using Ed25519 elliptic curve cryptography.
 * 
 * @param {Uint8Array} hashedSecret - The hashed stable secret
 * @returns {Object} An object containing private and public keys
 */
export const deriveKeyPair = (hashedSecret) => {
  console.log("STEP 4 & 5: Deriving private and public keys using Ed25519");
  
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
 * STEP 6: Generate DID:key from Public Key
 * 
 * Convert the public key to a W3C DID:key format.
 * 
 * @param {Uint8Array} publicKey - The Ed25519 public key
 * @returns {string} The DID in did:key format
 */
export const generateDIDKey = (publicKey) => {
  console.log("STEP 6: Generating DID:key from the public key");
  
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
 * This function implements different workflows for voters and key persons:
 * - Voters: ISO Template → SHA-256 Hash → DID
 * - Key Persons: ISO Template → Secret Key → Hash → Key Pair → DID:key
 * 
 * @param {Object} fingerprintTemplate - The fingerprint template object
 * @param {String} nationalId - The national ID of the person
 * @param {Boolean} isKeyPerson - Whether this is for a key person (optional)
 * @returns {Object} Contains DID (and key information for key persons)
 */
export const biometricToDID = (fingerprintTemplate, nationalId, isKeyPerson = false) => {
  console.log("Starting biometric to DID conversion process...");
  
  // Step 1: Extract template features
  const templateData = extractTemplate(fingerprintTemplate);

  let result;
  
  if (isKeyPerson) {
    // For key persons, follow the full key generation process
    console.log("Processing as key person - generating cryptographic keys");
    
    // Step 2: Generate stable secret key directly from ISO template
    const stableSecret = generateStableSecretKey(templateData);
    
    // Step 3: Hash the stable secret
    const hashedSecret = hashStableSecret(stableSecret);
    
    // Step 4: Derive cryptographic key pair
    const { privateKey, publicKey } = deriveKeyPair(hashedSecret);
    
    // Step 5: Generate DID:key
    const didKey = generateDIDKey(publicKey);
    
    // Convert binary keys to hex strings for storage and display
    result = {
      didKey,
      privateKey: bytesToHex(privateKey),
      publicKey: bytesToHex(publicKey)
    };
    
    // Store the DID keys in localStorage ONLY for key persons
    try {
      // Retrieve existing data or create new array if not present
      let didKeysData = JSON.parse(localStorage.getItem('testDIDKeys')) || [];
      
      // Check if an entry with the same nationalId already exists
      const existingIndex = didKeysData.findIndex(entry => entry.nationalId === nationalId);
      
      const didEntry = {
        nationalId,
        didKey,
        publicKey: bytesToHex(publicKey),
        privateKey: bytesToHex(privateKey)
      };
      
      if (existingIndex !== -1) {
        // Replace existing entry
        didKeysData[existingIndex] = didEntry;
      } else {
        // Add new entry
        didKeysData.push(didEntry);
      }
      
      // Save updated data back to localStorage
      localStorage.setItem('testDIDKeys', JSON.stringify(didKeysData));
      
      console.log(`DID keys for key person with national ID ${nationalId} saved to localStorage`);
    } catch (error) {
      console.error("Error saving DID keys to localStorage:", error);
      // Don't throw error as we don't want to interrupt the main process
    }
  } else {
    // For voters, directly generate a DID from the ISO template using SHA-256
    console.log("Processing as voter - generating simplified direct DID");
    const didKey = generateVoterDID(templateData);
    
    // For voters, only include the DID in the result
    result = { didKey };
  }
  
  console.log("✅ Biometric to DID conversion completed successfully");
  
  return result;
};

/**
 * Verify a Voter DID against a fingerprint template
 * 
 * Used for voter validation. Re-generates the DID from a fresh fingerprint scan
 * and compares it to the blockchain DID.
 * 
 * @param {Object} fingerprintTemplate - The fingerprint template from a fresh scan
 * @param {String} blockchainDID - The DID stored on the blockchain
 * @returns {Boolean} Whether the DIDs match
 */
export const verifyVoterDID = (fingerprintTemplate, blockchainDID) => {
  console.log("Verifying voter identity through DID comparison");
  
  try {
    // Extract template features
    const templateData = extractTemplate(fingerprintTemplate);
    
    // Generate a new DID from the template data
    const generatedDID = generateVoterDID(templateData);
    
    // Compare the generated DID with the one stored on the blockchain
    const isMatch = generatedDID === blockchainDID;
    
    console.log(`DID verification result: ${isMatch ? 'Match' : 'No match'}`);
    console.log(`Generated: ${generatedDID}`);
    console.log(`Expected: ${blockchainDID}`);
    
    return isMatch;
  } catch (error) {
    console.error("Error during DID verification:", error);
    return false;
  }
};

export default biometricToDID;