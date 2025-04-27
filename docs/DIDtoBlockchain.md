# DID to Blockchain Integration

## 🧩 Situation you have now

- 📄 Fingerprint Template: stored in your database.
- 🆔 Voter DID: stored in your database.
- 🚫 Private Keys: not stored (good — storing private keys is a huge risk).

## 🧠 So your two BIG questions are:

- How can I store the voter DID on blockchain safely?
- How can I validate a voter's fingerprint later without needing the private key?

## 🎯 Here's the correct design:
### Step 1: Save the Voter DID on the Blockchain

- You can publish the voter's DID document or DID string on-chain.
- This DID will point to the voter's public key.
- Typical format (on-chain record):

```json
{
  "did": "did:key:z6Mkf8a3...",
  "publicKey": "03f9f5d91f5d7d8f5c5b9e4d69c6a8396ed8a60b0b6d2d7bbfdb0ae585b1e2152",
  "status": "active"
}
```

✅ The public key is public anyway, so it's safe to store it directly.
✅ No private key is needed to be stored anywhere.

- You are just anchoring the voter's identity on-chain. You don't store private secrets.

### Step 2: When the Voter Scans a Fingerprint

You follow this flow:

1. Scan Fingerprint ➔ Get Biometric Template
2. Extract Stable Secret from the fingerprint (use Fuzzy Extractor if necessary).
3. Derive Private Key from the secret (privateKey = sha256(stableSecret)).
4. Compute Public Key from the derived private key.
5. Rebuild DID from public key.
6. Compare:
   - Reconstructed DID vs. DID stored in blockchain.
   - OR
   - Reconstructed Public Key vs. Public Key on blockchain.

If they match, ✅ the voter is authenticated.

No private key is ever stored or transmitted — it is recomputed on demand from the fingerprint.

## ⚡ Why This Works

- Fingerprint → stable secret → private key → public key → DID
- Each time a voter scans their finger, you regenerate the same chain.
- You don't store sensitive material.
- The blockchain serves as the global trusted reference.

## 🔥 Full Authentication Flow (Visual)

Voter Scans Fingerprint ➔
    Stable Feature Extraction ➔
    Derive Private Key ➔
    Derive Public Key ➔
    Build DID:key ➔
    Look up Blockchain ➔
    Compare DIDs or Public Keys ➔
    If match → Voter authenticated

## 🛡️ Extra Hardening You Can (and should) Consider

| Feature | Benefit |
|---------|---------|
| Use a Fuzzy Extractor | Makes biometric matching more tolerant to noise |
| Add a random salt during voter enrollment | Makes templates non-linkable across systems |
| Use blockchain smart contracts to manage DIDs | Automates activation/deactivation/status management |
| Allow rotation of biometric templates | In case user re-enrolls or changes biometrics |
| Implement audit trails | Track voter validation attempts securely |

## 📋 Sample On-Chain Data Model

```json
{
  "voterId": "VOTER12345",
  "did": "did:key:z6Mkf8a3...",
  "publicKey": "03f9f5d91f5d7d8f5c5b9e4d69c6a8396ed8a60b0b6d2d7bbfdb0ae585b1e2152",
  "status": "active",
  "timestamp": 1714278900
}
```

## 🧠 Summary of Strategy

| Thing | How you do it |
|-------|---------------|
| Store DID and PublicKey on blockchain | ✅ |
| Never store private key anywhere | ✅ |
| Regenerate private key from fingerprint at runtime | ✅ |
| Compare regenerated DID/PublicKey with blockchain record | ✅ |
| Authenticate voter if match | ✅ |

## 🎯 Conclusion

- You don't store private keys. You derive them "just in time" from the voter's live fingerprint, and verify against blockchain data.
- Super clean. Super secure. Exactly how decentralized identity should work. 🚀

## ✨ Bonus

### Smart Contract (Solidity) to Store and Validate DIDs On-Chain

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoterRegistry {
    struct Voter {
        address registrant;   // Who registered this voter
        string did;           // DID:key DID string
        bytes publicKey;      // Public key associated
        bool active;          // Is the voter active?
    }

    mapping(string => Voter) private voters; // DID -> Voter

    event VoterRegistered(string indexed did, address indexed registrant);
    event VoterStatusUpdated(string indexed did, bool active);

    function registerVoter(string memory did, bytes memory publicKey) external {
        require(bytes(did).length > 0, "DID required");
        require(publicKey.length > 0, "Public key required");
        require(voters[did].registrant == address(0), "Voter already registered");

        voters[did] = Voter({
            registrant: msg.sender,
            did: did,
            publicKey: publicKey,
            active: true
        });

        emit VoterRegistered(did, msg.sender);
    }

    function deactivateVoter(string memory did) external {
        require(voters[did].registrant != address(0), "Voter not found");

        voters[did].active = false;

        emit VoterStatusUpdated(did, false);
    }

    function getVoterPublicKey(string memory did) external view returns (bytes memory, bool) {
        require(voters[did].registrant != address(0), "Voter not found");

        return (voters[did].publicKey, voters[did].active);
    }

    function isVoterActive(string memory did) external view returns (bool) {
        require(voters[did].registrant != address(0), "Voter not found");

        return voters[did].active;
    }
}
```

### JavaScript Flow to Validate Fingerprint ➔ DID

```javascript
import { sha256 } from '@noble/hashes/sha256';
import { base58btc } from 'multiformats/bases/base58';
import { ed25519 } from '@noble/curves/ed25519';
import { ethers } from 'ethers'; // Using ethers.js to talk to blockchain

// Connect to blockchain (example with local Ganache, Sepolia, etc.)
const provider = new ethers.JsonRpcProvider("http://localhost:8545"); 
const voterRegistryAddress = "0xYourContractAddressHere";
const voterRegistryABI = [ 
  "function getVoterPublicKey(string did) view returns (bytes memory, bool)"
];
const voterRegistry = new ethers.Contract(voterRegistryAddress, voterRegistryABI, provider);

/**
 * Reconstruct public key and DID from biometric input
 */
function reconstructIdentityFromFingerprint(fakeBiometricInput) {
  const stableSecret = sha256(Buffer.from(fakeBiometricInput, 'utf-8'));
  const privateKey = stableSecret.slice(0, 32);
  const publicKey = ed25519.getPublicKey(privateKey);

  const ed25519Prefix = Uint8Array.from([0xed, 0x01]);
  const prefixedKey = new Uint8Array(ed25519Prefix.length + publicKey.length);
  prefixedKey.set(ed25519Prefix, 0);
  prefixedKey.set(publicKey, ed25519Prefix.length);

  const multibaseEncoded = base58btc.encode(prefixedKey);
  const didKey = `did:key:${multibaseEncoded}`;

  return { didKey, publicKey };
}

/**
 * Validate voter against on-chain DID and public key
 */
async function validateVoter(fakeBiometricInput) {
  const { didKey, publicKey } = reconstructIdentityFromFingerprint(fakeBiometricInput);

  try {
    const [storedPublicKey, active] = await voterRegistry.getVoterPublicKey(didKey);

    if (!active) {
      console.log("⛔ Voter is inactive!");
      return false;
    }

    // Compare public keys
    const publicKeyHex = Buffer.from(publicKey).toString('hex');
    const storedPublicKeyHex = Buffer.from(storedPublicKey).toString('hex');

    if (publicKeyHex === storedPublicKeyHex) {
      console.log("✅ Voter authenticated successfully!");
      return true;
    } else {
      console.log("⛔ Public key mismatch!");
      return false;
    }
  } catch (err) {
    console.error("Error validating voter:", err);
    return false;
  }
}

// Example usage
const fakeFingerprintScan = 'UserBiometricScan_Session2';
validateVoter(fakeFingerprintScan);
```

### Full System Flow (Putting it all together)

| Step | Description |
|------|-------------|
| Enroll voter | Extract fingerprint, generate DID & publicKey, store them on blockchain using registerVoter() |
| Voter authentication | Scan fingerprint, regenerate DID & publicKey, lookup DID on blockchain, validate publicKey match |