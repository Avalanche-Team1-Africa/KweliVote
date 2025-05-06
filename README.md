# KweliVote: Blockchain-Based Biometric Identity System for Electoral Processes

## Overview

KweliVote is a blockchain-based biometric identity management application designed to ensure transparent and credible electoral processes for Burundi's upcoming elections. The application addresses the challenges of electoral fraud by implementing a secure, decentralized platform for managing voter identities.

### Problem Statement

Burundi faces significant challenges in ensuring transparent electoral processes due to:
- Absence of unique identifiers for citizens
- Lack of biometric identity cards
- History of electoral fraud (multiple voting, identity manipulation)
- Data security and privacy concerns

### Solution

KweliVote implements a blockchain-based biometric identity system that:
1. Integrates biometric data (fingerprints) with a blockchain ledger
2. Creates unique, tamper-proof identifiers for each voter
3. Prevents identity duplication and manipulation
4. Enables real-time verification at polling stations
5. Enhances data security through cryptographic keys

## Technical Architecture

### Biometric to DID Conversion

KweliVote transforms a voter's biometric data (fingerprint) into a Decentralized Identifier (DID) through a secure, privacy-preserving process:

1. **Biometric Capture**: Fingerprint data is captured using hardware readers or uploaded images
2. **Template Extraction**: Raw fingerprint data is converted to ANSI-378 format
3. **Feature Stabilization**: Techniques are applied to ensure consistent outputs
4. **Cryptographic Key Derivation**: The stabilized template generates a cryptographic keypair
5. **DID Generation**: A W3C-compliant DID:key is created

### DID to Blockchain Integration

The system securely stores voter DIDs on the blockchain:

1. **Storage**: Only public DIDs and public keys are stored on-chain
2. **Private Keys**: Never stored; derived "just in time" from the voter's fingerprint
3. **Verification**: During voting, fingerprints are scanned and DIDs reconstructed to verify against blockchain records

#### Blockchain Record Format

```json
{
  "voterId": "VOTER12345",
  "did": "did:key:z6Mkf8a3...",
  "publicKey": "03f9f5d91f5d7d8f5c5b9e4d69c6a8396ed8a60b0b6d2d7bbfdb0ae585b1e2152",
  "status": "active",
  "timestamp": 1714278900
}
```

### Authentication Flow

1. Voter scans fingerprint at polling station
2. System extracts stable secret from the fingerprint
3. Private key is derived from the secret (never stored)
4. Public key is computed from the derived private key
5. DID is rebuilt from the public key
6. System compares reconstructed DID/public key with blockchain record
7. If they match, the voter is authenticated

## Key Features

- Mobile-responsive web application
- Secure biometric-based authentication
- Blockchain verification to prevent fraud
- Real-time validation at polling stations
- Transparent audit trail

## Key Roles

| Role | Responsibility |
|------|---------------|
| Registration Clerks | Register new voters at designated centers |
| IEBC Constituency Election Coordinators | Register registration clerks, polling clerks, and other officials |
| Polling Clerks | Verify voters biometrically |
| Party Agents | Validate results count |
| Observers | Validate results count |
| Presiding Officers | Validate results count |

## Installing Biometric Processing Tools

### ImageMagick Installation

ImageMagick is used for image processing and conversion of fingerprint images.

1. **Install via package manager:**
   ```bash
   sudo apt update
   sudo apt install imagemagick
   ```

2. **Verify installation:**
   ```bash
   convert --version
   ```

### NIST Biometric Image Software (NBIS) Installation

NBIS provides essential tools for fingerprint minutiae extraction and template conversion.

1. **Install build dependencies:**
   ```bash
   sudo apt update
   sudo apt install build-essential libpng-dev libjpeg-dev git
   ```

2. **Download NBIS source code from GitHub:**
   ```bash
   mkdir -p ~/nbis_build
   cd ~/nbis_build
   git clone https://github.com/usnistgov/nbis.git nbis_source
   ```

3. **Setup build environment:**
   ```bash
   cd ~/nbis_build
   # Create a build directory
   mkdir -p ~/nbis_build/nbis
   ```

4. **Configure and build NBIS:**
   ```bash
   cd ~/nbis_build/nbis_source
   ./setup.sh ~/nbis_build/nbis
   cd ~/nbis_build/nbis
   make config
   make it
   ```
   Note: The build process may show some warnings which can usually be ignored. The build might not complete fully but as long as the key components are built, we can proceed.

5. **Compile key tools:**
   ```bash
   cd ~/nbis_build/nbis/mindtct/src/bin/mindtct && make
   cd ~/nbis_build/nbis/bozorth3/src/bin/bozorth3 && make
   ```

6. **Install libraries and executables:**
   ```bash
   # Install libraries
   sudo cp -r ~/nbis_build/nbis/exports/lib/* /usr/local/lib/
   sudo cp -r ~/nbis_build/nbis/exports/include/* /usr/local/include/
   sudo ldconfig
   
   # Install binaries
   sudo mkdir -p /usr/local/bin
   sudo cp ~/nbis_build/nbis/mindtct/bin/mindtct /usr/local/bin/
   sudo cp ~/nbis_build/nbis/bozorth3/bin/bozorth3 /usr/local/bin/
   ```

7. **Verify installation:**
   ```bash
   # Check if executables are in path
   which mindtct
   which bozorth3
   ```

#### Using NBIS Tools for Fingerprint Processing

The key tools installed are:

- **mindtct**: Extracts minutiae data from fingerprint images
- **bozorth3**: Matches fingerprint minutiae and generates comparison scores

Example usage:
```bash
# Extract minutiae from a fingerprint image
mindtct fingerprint.png output_prefix

# Compare two fingerprints (returns a match score)
bozorth3 fingerprint1.xyt fingerprint2.xyt
```

## Setup Instructions

### Backend Setup (Django)

1. **Navigate to the backend directory:**
   ```
   cd kwelivote-app/backend
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install required packages:**
   ```
   pip install -r requirements.txt
   ```

4. **Setup PostgreSQL:**
   ```
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Start PostgreSQL service
   sudo systemctl start postgresql
   
   # Create database and user
   sudo -u postgres psql
   
   # Inside PostgreSQL console
   CREATE USER kwelivote WITH PASSWORD 'kwelivote';
   ALTER USER kwelivote CREATEDB;
   CREATE DATABASE kwelivote_db OWNER kwelivote;
   GRANT ALL PRIVILEGES ON DATABASE kwelivote_db TO kwelivote;
   \q
   ```

5. **Configure Database Connection:**
   - Ensure the PostgreSQL connection is properly configured in `kwelivote_app/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'kwelivote_db',
           'USER': 'kwelivote',
           'PASSWORD': 'kwelivote',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

6. **Install PostgreSQL adapter for Python:**
   ```
   pip install psycopg2-binary
   ```

7. **Run migrations:**
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```

8. **Populate database with test data (optional):**
   ```
   python manage.py populate_db
   ```

9. **Create a superuser:**
   ```
   python manage.py createsuperuser
   ```

10. **Link KeyPersons to User accounts:**
    ```
    # Create user accounts for all KeyPersons who are not Observers and link them
    python manage.py link_keypersons_to_users
    
    # To first see what would be done without making changes, use --dry-run flag
    python manage.py link_keypersons_to_users --dry-run
    ```

    This will:
    - Generate username based on first name and last 4 digits of national ID
    - Create strong random passwords (which will be displayed in the output)
    - Set email addresses as username@kwelivote.example.com
    - Link user accounts to the corresponding KeyPerson records

11. **Create specific test data (optional):**
    ```
    # Create data in this sequence for proper relationships
    python manage.py create_keypersons
    python manage.py create_voters
    python manage.py create_candidates
    python manage.py create_results
    ```

12. **Run the development server:**
    ```
    python manage.py runserver
    ```

### Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```
   cd kwelivote-app/frontend
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Update API configuration:**
   - Ensure the API endpoint in src/services/apiService.js points to your backend server

4. **Start the development server:**
   ```
   npm start
   ```

5. **Build for production:**
   ```
   npm run build
   ```

## Testing the Application

1. Access the admin panel at http://localhost:8000/admin
2. Login with superuser credentials
3. Create test users with different roles (Registration Clerk, Polling Clerk, etc.)
4. Access the frontend at http://localhost:3000
5. Login with created user credentials to test the appropriate workflows

## Security Considerations

- All biometric processing happens client-side
- Raw fingerprint data never leaves the user's device
- Only derived DIDs (which cannot be reversed) are sent to the server
- Private keys are properly handled and secured

## Smart Contract Deployment to Avalanche

### Prerequisites

1. **Node.js and npm**:
   ```bash
   # Check if Node.js and npm are installed
   node --version
   npm --version
   
   # If not installed, install them through your package manager
   # For Ubuntu/Debian:
   sudo apt update
   sudo apt install nodejs npm
   ```

2. **Install Hardhat**:
   ```bash
   # Navigate to the frontend directory
   cd kwelivote-app/frontend
   
   # Install Hardhat locally
   npm install --save-dev hardhat
   ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the frontend directory:
   ```bash
   touch .env
   ```
   - Add your private key and API keys:
   ```
   # Wallet private key for contract deployment (without 0x prefix)
   PRIVATE_KEY=your_private_key_here
   
   # Avalanche Fuji Testnet RPC URL and Chain ID
   REACT_APP_AVALANCHE_API=https://api.avax-test.network
   REACT_APP_AVALANCHE_CHAIN_ID=43113
   REACT_APP_AVALANCHE_RPC_ENDPOINT=https://api.avax-test.network/ext/bc/C/rpc
   REACT_APP_AVALANCHE_EXPLORER_URL=https://testnet.snowtrace.io
   ```

### Deployment Steps

1. **Configure Hardhat**:
   - Make sure your `hardhat.config.js` includes the Avalanche Fuji testnet configuration:

   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require('dotenv').config();
   
   const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
   
   module.exports = {
     solidity: "0.8.19",
     networks: {
       fuji: {
         url: process.env.REACT_APP_AVALANCHE_RPC_ENDPOINT || "https://api.avax-test.network/ext/bc/C/rpc",
         chainId: parseInt(process.env.REACT_APP_AVALANCHE_CHAIN_ID || "43113"),
         accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
         gasPrice: 225000000000,
       },
       mainnet: {
         url: "https://api.avax.network/ext/bc/C/rpc",
         chainId: 43114,
         accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
         gasPrice: 225000000000,
       }
     },
     etherscan: {
       apiKey: process.env.SNOWTRACE_API_KEY,
     },
   };
   ```

2. **Install Required Dependencies**:
   ```bash
   npm install --save-dev @nomicfoundation/hardhat-toolbox dotenv
   ```

3. **Compile Smart Contract**:
   ```bash
   npx hardhat compile
   ```

4. **Deploy to Avalanche Fuji Testnet**:
   - Create or modify a deployment script in `scripts/deploy.js`:
   
   ```javascript
   const hre = require("hardhat");

   async function main() {
     console.log("Deploying VoterDID contract to Avalanche Fuji Testnet...");
   
     // Get the ContractFactory
     const VoterDID = await hre.ethers.getContractFactory("VoterDID");
     
     // Deploy it
     const voterDID = await VoterDID.deploy();
     
     // Wait for deployment to finish
     await voterDID.deployed();
   
     console.log(`VoterDID deployed to: ${voterDID.address}`);
     console.log(`Transaction hash: ${voterDID.deployTransaction.hash}`);
     console.log(`Block number: ${voterDID.deployTransaction.blockNumber}`);
     console.log("View on explorer:", `${process.env.REACT_APP_AVALANCHE_EXPLORER_URL}/address/${voterDID.address}`);
   
     return voterDID;
   }
   
   main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error("Deployment failed:", error);
       process.exit(1);
     });
   ```
   
   - Run deployment:
   ```bash
   npx hardhat run scripts/deploy.js --network fuji
   ```
   
5. **Verify Smart Contract on Snowtrace (Optional)**:
   ```bash
   # Get your contract address from the deployment output
   npx hardhat verify --network fuji YOUR_CONTRACT_ADDRESS
   ```

6. **Update Frontend Configuration**:
   - Add the deployed contract address to your `.env` file:
   ```
   REACT_APP_VOTER_DID_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

### Testing the Deployed Contract

1. **Manual Testing via Hardhat Console**:
   ```bash
   npx hardhat console --network fuji
   
   # Inside the console:
   > const VoterDID = await ethers.getContractFactory("VoterDID")
   > const contract = await VoterDID.attach("YOUR_DEPLOYED_CONTRACT_ADDRESS")
   > await contract.registerDID("TEST123", "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK")
   > await contract.getDID("TEST123")
   ```

2. **Run Contract Tests**:
   ```bash
   npx hardhat test --network fuji
   ```

### Common Issues and Solutions

1. **Not enough funds**: Ensure your wallet has enough AVAX for deployment
   - Get test AVAX from the [Fuji Testnet Faucet](https://faucet.avax.network/)

2. **Gas price errors**: Update the gasPrice in hardhat.config.js

3. **Network connectivity issues**: Check that the RPC endpoint is correct and accessible

4. **Transaction underpriced**: Increase gasPrice in your hardhat.config.js

5. **Nonce too high/low**: If you're reusing a wallet address, you may need to reset your account nonce:
   ```bash
   # Check your current nonce
   npx hardhat run scripts/check-nonce.js --network fuji
   ```

6. **Contract verification failures**: Ensure you're using the exact compiler version used for deployment

### Further Resources

- [Avalanche Documentation](https://docs.avax.network/)
- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Fuji Testnet Explorer](https://testnet.snowtrace.io/)
- [Avalanche Fuji Testnet Faucet](https://faucet.avax.network/)