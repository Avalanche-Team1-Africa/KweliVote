# Azure Deployment: Biometric Processing Configuration

This document outlines how to deploy and configure the biometric processing components of the KweliVote application in Azure, with a focus on the fingerprint template fusion functionality.

## Overview

The KweliVote application includes advanced biometric processing capabilities, particularly fingerprint template fusion, which combines multiple fingerprint scans into a single high-quality template for more reliable identification. This document provides guidance on configuring Azure resources to support these computationally intensive operations.

## Prerequisites

1. Basic Azure deployment completed according to the main deployment guide
2. Azure App Service for the backend API created and running
3. Proper connectivity between the frontend and backend components

## Azure Configuration for Biometric Processing

### 1. App Service Plan Requirements

Biometric processing, especially template fusion with DBSCAN clustering, requires adequate computational resources. Ensure your App Service Plan meets these minimum requirements:

```bash
# Update App Service Plan to P1V2 or higher for biometric processing
az appservice plan update \
  --resource-group kwelivote-rg \
  --name kwelivote-plan \
  --sku P1V2
```

For production environments with high volume, consider:

```bash
# Update to P2V2 for high-volume production environments
az appservice plan update \
  --resource-group kwelivote-rg \
  --name kwelivote-plan \
  --sku P2V2
```

### 2. Environment Variables

Configure the following environment variables for template fusion settings:

```bash
# Configure biometric processing environment variables
az webapp config appsettings set \
  --resource-group kwelivote-rg \
  --name kwelivote-api \
  --settings \
  BIOMETRIC_FUSION_ENABLED=True \
  TEMPLATE_FUSION_MIN_SAMPLES=2 \
  TEMPLATE_FUSION_EPS=12
```

Parameter explanation:
- `BIOMETRIC_FUSION_ENABLED`: Enables or disables the template fusion process
- `TEMPLATE_FUSION_MIN_SAMPLES`: DBSCAN parameter for minimum points to form a cluster (default: 2)
- `TEMPLATE_FUSION_EPS`: DBSCAN parameter for maximum distance between points in a cluster (default: 12)

### 3. Temporary Storage Configuration

Biometric processing requires temporary storage for intermediate files. Configure the App Service instance with appropriate temporary storage:

```bash
# Configure storage for temporary biometric processing
az webapp config appsettings set \
  --resource-group kwelivote-rg \
  --name kwelivote-api \
  --settings \
  BIOMETRIC_TEMP_STORAGE=/home/site/wwwroot/tmp \
  TEMPLATE_STORAGE_DAYS=1
```

### 4. Security Configuration

Given the sensitive nature of biometric data, implement additional security measures:

```bash
# Enable always-on HTTPS
az webapp update \
  --resource-group kwelivote-rg \
  --name kwelivote-api \
  --https-only true

# Configure CORS specifically for biometric endpoints
az webapp cors add \
  --resource-group kwelivote-rg \
  --name kwelivote-api \
  --allowed-origins "https://kwelivote-web.azurestaticapps.net"
```

## Monitoring Biometric Processing

Add specific monitoring for biometric processing performance:

```bash
# Create a custom metric for biometric processing
az monitor metrics alert create \
  --name "Biometric Processing Time Alert" \
  --resource-group kwelivote-rg \
  --scopes $(az webapp show --resource-group kwelivote-rg --name kwelivote-api --query id -o tsv) \
  --condition "avg customMetrics/BiometricProcessingTimeMs > 5000" \
  --window-size 5m \
  --evaluation-frequency 5m \
  --action $(az monitor action-group show --resource-group kwelivote-rg --name developers --query id -o tsv)
```

## Testing Biometric Integration

After deployment, verify the biometric processing functionality:

1. **Health Check**:
   ```bash
   curl -X GET https://kwelivote-api.azurewebsites.net/api/health-check/biometric/
   ```

2. **Processing Time Check**:
   ```bash
   curl -X GET https://kwelivote-api.azurewebsites.net/api/fingerprints/performance/
   ```

## Scaling Considerations

For high-volume scenarios:

1. **Auto-scaling**:
   ```bash
   # Configure autoscaling based on CPU usage
   az monitor autoscale create \
     --resource-group kwelivote-rg \
     --resource kwelivote-plan \
     --resource-type "Microsoft.Web/serverfarms" \
     --name "BiometricProcessingAutoScale" \
     --min-count 1 \
     --max-count 5 \
     --count 1
   
   # Add a scale rule based on CPU percentage
   az monitor autoscale rule create \
     --resource-group kwelivote-rg \
     --autoscale-name "BiometricProcessingAutoScale" \
     --scale out 1 \
     --condition "Percentage CPU > 70 avg 5m"
   ```

2. **Manual scaling during peak registration periods**:
   ```bash
   # Temporarily scale up instances during peak registration
   az appservice plan update \
     --resource-group kwelivote-rg \
     --name kwelivote-plan \
     --number-of-workers 3
   ```

## Troubleshooting

Common issues and solutions:

1. **High Memory Usage**: If experiencing high memory usage during template fusion:
   ```bash
   # Increase memory allocation
   az webapp config set \
     --resource-group kwelivote-rg \
     --name kwelivote-api \
     --generic-configurations '{"maxMemoryInMb": 2048}'
   ```

2. **Slow Processing**: For slow template fusion processing:
   ```bash
   # Check logs for processing times
   az webapp log tail \
     --resource-group kwelivote-rg \
     --name kwelivote-api \
     --filter "biometric"
   ```

3. **Backend Crashes**: If the backend crashes during biometric processing:
   ```bash
   # Enable detailed logging
   az webapp log config \
     --resource-group kwelivote-rg \
     --name kwelivote-api \
     --application-logging filesystem \
     --detailed-error-messages true \
     --level information
   ```

## Next Steps

1. Implement regular backups of fingerprint templates
2. Consider implementing a dedicated API Management service for biometric endpoints
3. Evaluate private networking options for enhanced security
4. Explore Azure Cognitive Services integration for additional biometric capabilities
