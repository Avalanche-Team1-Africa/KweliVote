# KweliVote Avalanche Blockchain Integration

## Overview

This document describes the integration of KweliVote's voter registration system with the Avalanche blockchain platform through a custom subnet. The integration enables secure, immutable storage of voter Decentralized Identifiers (DIDs) on a blockchain, enhancing transparency and trust in the electoral process.

## Architecture

The KweliVote blockchain integration follows a layered architecture:

1. **Frontend Layer**: React components for user interaction
2. **Service Layer**: Blockchain service for blockchain interactions
3. **Utility Layer**: Avalanche utilities for low-level blockchain operations
4. **Smart Contract Layer**: Solidity contract deployed on Avalanche subnet
5. **Blockchain Layer**: Custom Avalanche subnet

![Architecture Diagram](./blockchain-architecture.png)

## Components

### 1. Smart Contract (VoterDID.sol)

The `VoterDID` smart contract serves as the on-chain registry for voter DIDs. It maps national IDs to their corresponding DIDs and provides verification mechanisms.

Key functions:
- `registerVoter(string did, string nationalId)`: Registers or updates a voter's DID
- `getVoterDID(string nationalId)`: Retrieves a voter's DID
- `verifyDID(string nationalId, string did)`: Verifies if a DID matches what's recorded for a voter

### 2. Blockchain Service (BlockchainService.js)

This service provides a high-level API for interacting with the blockchain infrastructure, abstracting away the complexities of direct blockchain operations.

Key functions:
- `initialize()`: Set up connections to the Avalanche network
- `setupBlockchainInfrastructure(adminKey)`: Create a subnet, deploy a blockchain, and deploy the smart contract
- `registerVoterDID(voterDID, nationalId)`: Record a voter's DID on the blockchain
- `verifyVoterDID(nationalId)`: Check if a DID exists for a given national ID

### 3. Avalanche Utilities (avalancheUtils.js)

Low-level functions for interacting with the Avalanche network, handling subnet creation, blockchain deployment, and smart contract interactions.

Key functions:
- `initAvalanche()`: Initialize connection to Avalanche network
- `createSubnet(privateKey)`: Create a custom Avalanche subnet
- `createBlockchain(privateKey, subnetId)`: Create a blockchain on the subnet
- `deployVoterDIDContract(privateKey, blockchainId)`: Deploy the voter DID smart contract
- `storeVoterDID(voterDID, nationalId, privateKey)`: Store a DID on the blockchain
- `verifyVoterDID(nationalId)`: Verify a DID on the blockchain

### 4. React Components

- **BlockchainSetup**: Admin interface for setting up the blockchain infrastructure
- **BlockchainExplorer**: Interface for verifying voter DIDs on the blockchain
- **VoterRegister** (Enhanced): Integrated with blockchain functionality to store DIDs when registering voters

## Flow of Operations

### Blockchain Setup (Administrator)

1. Admin navigates to the BlockchainSetup component
2. Provides Avalanche private key with sufficient AVAX balance
3. System creates a custom subnet
4. System deploys a blockchain on the subnet
5. System deploys the VoterDID smart contract
6. Configuration is saved securely for future use

### Voter Registration with Blockchain Integration

1. Registration officer collects voter information and biometric data
2. System converts biometric data into a DID using the existing biometricToDID utility
3. System stores the DID in the local database
4. System also stores the DID on the Avalanche blockchain subnet
5. The blockchain transaction hash is saved with the voter record
6. Registration is complete with both local and blockchain records

### Verification Process

1. User enters a national ID in the Blockchain Explorer
2. System queries the blockchain for the DID associated with the ID
3. If found, the system displays the DID and confirmation
4. If not found, the system indicates that no blockchain record exists

## Database Schema Updates

The Voter model has been updated to include blockchain-related fields:

```python
class Voter(models.Model):
    # ...existing fields...
    
    # Blockchain fields
    blockchain_tx_id = models.CharField(max_length=255, blank=True, null=True)
    blockchain_subnet_id = models.CharField(max_length=255, blank=True, null=True)
    
    # ...other existing fields...
```

## Security Considerations

1. **Private Key Management**: Private keys are never stored in the database. Admin keys are temporarily stored in localStorage for development but should use a secure key management system in production.

2. **Biometric Privacy**: Biometric data never leaves the client. Only the derived DID (which cannot be reversed to obtain biometrics) is stored on the blockchain.

3. **Blockchain Identity**: The system uses W3C DID:key format, ensuring interoperability with other DID systems.

4. **Smart Contract Access Control**: Only authorized admins can register DIDs on the blockchain using the contract's access control mechanisms.

## Production Deployment Notes

For production deployment, the following enhancements should be made:

1. **Subnet Hosting**: Deploy dedicated Avalanche validators for the custom subnet
2. **Key Management**: Use a secure HSM or key management service for private keys
3. **Transaction Monitoring**: Implement a monitoring system for blockchain transactions
4. **Gas Management**: Implement a system to manage AVAX for gas fees
5. **Disaster Recovery**: Implement backup and recovery procedures for blockchain data

## Conclusion

The integration of Avalanche blockchain technology with the KweliVote system provides a robust, transparent solution for storing voter identities. By leveraging Avalanche's subnet architecture, the system achieves both security and scalability, ensuring the integrity of the voter registration process.

---

*Last updated: April 27, 2025*