# ElectionResults Contract Deployment Guide

This guide explains how to deploy the ElectionResults smart contract to the Avalanche blockchain.

## Prerequisites

1. Node.js and npm installed
2. Private key for an Avalanche wallet with sufficient AVAX for gas fees
3. Access to the KweliVote project repository

## Deployment Steps

### 1. Configure Environment

Set your private key as an environment variable:

```bash
export PRIVATE_KEY=0x123abc... # Replace with your actual private key
```

⚠️ **Security Warning**: Never commit your private key to version control or share it with others.

### 2. Deploy to Avalanche Testnet (Fuji)

```bash
cd /path/to/kwelivote-app/frontend
./scripts/deploy-election-results.sh fuji
```

### 3. Deploy to Avalanche Mainnet

```bash
cd /path/to/kwelivote-app/frontend
./scripts/deploy-election-results.sh mainnet
```

## Verification After Deployment

1. The deployment script will output the contract address and transaction hash
2. You can verify the deployment by checking the transaction on:
   - Fuji Testnet: https://testnet.snowtrace.io/
   - Mainnet: https://snowtrace.io/

## Integration with Frontend

After deployment, update the contract address in your frontend configuration:

1. Note the deployed contract address from the deployment output
2. Update the contract address in the blockchain service configuration file

## Key Functions

The ElectionResults contract provides the following key functions:

1. `registerKeyPerson`: Register election officials with their roles
2. `submitResults`: Submit election results (Presiding Officer only)
3. `signAsPartyAgent`: Sign/verify results as a Party Agent
4. `signAsObserver`: Sign/verify results as an Observer
5. Various query functions to check results and signature status
