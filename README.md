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