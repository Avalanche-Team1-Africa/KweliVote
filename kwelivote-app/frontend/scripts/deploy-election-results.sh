#!/bin/bash

# Script to deploy the ElectionResults contract to Avalanche blockchain
# Usage: ./deploy-election-results.sh [network]
# Where network is one of: localhost, fuji, mainnet (defaults to fuji)

# Default to fuji (testnet) if no network specified
NETWORK=${1:-fuji}

# Navigate to the frontend directory
cd "$(dirname "$0")/.."

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# If PRIVATE_KEY doesn't have 0x prefix, add it
if [[ $PRIVATE_KEY != 0x* ]]; then
  export PRIVATE_KEY="0x$PRIVATE_KEY"
fi

# Check for PRIVATE_KEY in environment
if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY environment variable is not set"
  echo "Please set your private key in the .env file or export it: export PRIVATE_KEY=your_private_key_here"
  exit 1
fi

echo "Compiling contracts..."
npx hardhat compile

echo "Deploying ElectionResults contract to $NETWORK network..."
npx hardhat run scripts/deploy-election-results.js --network $NETWORK
