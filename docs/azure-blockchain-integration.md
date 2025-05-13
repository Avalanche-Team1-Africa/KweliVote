# Azure Deployment: Blockchain Integration

This document outlines the steps for integrating the Avalanche blockchain with your KweliVote application deployed on Azure.

## Prerequisites

1. Smart contract already deployed to Avalanche Fuji testnet (address: 0xca60f52dC2A61cF8D2aC9E1213B8f46eBC1a3560)
2. Azure resources created according to the main deployment guide

## Blockchain Configuration in Azure

### 1. Environment Variables

The following environment variables need to be set in your Azure Static Web App configuration:

```
REACT_APP_AVALANCHE_NETWORK_NAME=Avalanche Fuji C-Chain
REACT_APP_AVALANCHE_API=https://api.avax-test.network
REACT_APP_AVALANCHE_CHAIN_ID=43113
REACT_APP_AVALANCHE_RPC_ENDPOINT=https://api.avax-test.network/ext/bc/C/rpc
REACT_APP_AVALANCHE_EXPLORER_URL=https://testnet.snowtrace.io
REACT_APP_VOTER_DID_CONTRACT_ADDRESS=0xca60f52dC2A61cF8D2aC9E1213B8f46eBC1a3560
```

You can set these through the Azure Portal or using Azure CLI:

```bash
az staticwebapp appsettings set \
  --name kwelivote-web \
  --resource-group kwelivote-rg \
  --setting-names \
  REACT_APP_AVALANCHE_NETWORK_NAME="Avalanche Fuji C-Chain" \
  REACT_APP_AVALANCHE_API="https://api.avax-test.network" \
  REACT_APP_AVALANCHE_CHAIN_ID="43113" \
  REACT_APP_AVALANCHE_RPC_ENDPOINT="https://api.avax-test.network/ext/bc/C/rpc" \
  REACT_APP_AVALANCHE_EXPLORER_URL="https://testnet.snowtrace.io" \
  REACT_APP_VOTER_DID_CONTRACT_ADDRESS="0xca60f52dC2A61cF8D2aC9E1213B8f46eBC1a3560"
```

### 2. Admin Private Key Management

For security reasons, the admin private key should be managed carefully in Azure:

1. **Never store the private key in your repository or code**
2. **Use Azure Key Vault to manage sensitive keys**:

```bash
# Create an Azure Key Vault
az keyvault create --name kwelivote-keyvault --resource-group kwelivote-rg --location westeurope

# Add the admin private key to the key vault
az keyvault secret set --vault-name kwelivote-keyvault --name admin-private-key --value "A7b9f6989ff480042ecfdb0f1aee605ec59a6b0937adf9264e4c6fbbfef295bc"

# Assign identity to your Static Web App to access Key Vault
az staticwebapp identity assign --name kwelivote-web --resource-group kwelivote-rg --identities [system]

# Grant access to the Static Web App to read secrets
az keyvault set-policy --name kwelivote-keyvault --object-id <identity-principal-id> --secret-permissions get list
```

3. **For development/testing only**, you can set the private key directly as an environment variable:

```bash
az staticwebapp appsettings set \
  --name kwelivote-web \
  --resource-group kwelivote-rg \
  --setting-names \
  REACT_APP_ADMIN_PRIVATE_KEY="A7b9f6989ff480042ecfdb0f1aee605ec59a6b0937adf9264e4c6fbbfef295bc"
```

### 3. CORS Configuration

Ensure Cross-Origin Resource Sharing (CORS) is properly configured in your backend settings to allow requests from your frontend to the blockchain:

```python
# In production_settings.py

CORS_ALLOWED_ORIGINS = [
    'https://kwelivote-web.azurestaticapps.net',
    # Other allowed origins
]

# Also allow these headers for blockchain integration
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-blockchain-signature',  # Custom header for blockchain signatures
]
```

### 4. Network Security Rules

If using an Avalanche private subnet, ensure your Azure resources can communicate with it:

```bash
# Add network security group rule to allow outbound traffic to Avalanche nodes
az network nsg rule create \
  --resource-group kwelivote-rg \
  --nsg-name kwelivote-nsg \
  --name AllowAvalancheTraffic \
  --priority 100 \
  --direction Outbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefix '*' \
  --source-port-range '*' \
  --destination-address-prefix 'AvalancheSubnetIPRange' \
  --destination-port-range '*'
```

## Testing the Blockchain Integration

After deployment, verify the blockchain integration:

1. **Check Contract Connection**:
   - Log into the application
   - Attempt to register a new voter which will interact with the blockchain
   - Verify transaction success in the application logs

2. **Monitor RPC Calls**:
   - Use Azure Application Insights to monitor API calls to the Avalanche RPC endpoint
   - Look for errors or timeouts that may indicate connectivity issues

3. **Transaction Verification**:
   - Use the Avalanche Explorer (https://testnet.snowtrace.io) to verify that transactions are being recorded on-chain
   - Check that the contract address matches the one in your configuration

## Troubleshooting

Common issues and solutions:

1. **RPC Connection Failures**:
   - Verify that the Avalanche RPC endpoint is accessible from your Azure resources
   - Check for any network restrictions or firewall rules

2. **Transaction Errors**:
   - Ensure the admin wallet has enough AVAX tokens for gas fees
   - Verify the contract ABI matches the deployed contract

3. **Private Key Issues**:
   - If using Azure Key Vault, check that identity permissions are correctly configured
   - Ensure the private key format is correct (no 0x prefix)

## Security Considerations

1. **Key Protection**:
   - Regularly rotate admin private keys
   - Use Azure Key Vault for secure storage
   - Limit access to keys to only necessary services

2. **Contract Access Control**:
   - Ensure your smart contract has proper access controls to prevent unauthorized modifications
   - Consider implementing a multi-signature requirement for critical operations

3. **Monitoring**:
   - Set up alerts for unusual blockchain activity
   - Monitor gas usage to prevent unexpected costs

## Next Steps

1. **Consider moving to Avalanche Mainnet** for production when ready
2. **Implement smart contract upgradability pattern** for future enhancements
3. **Set up automated testing** for blockchain interactions
