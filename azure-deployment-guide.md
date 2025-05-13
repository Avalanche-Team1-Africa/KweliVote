# Azure Deployment Configuration Guide
# KweliVote Application

## Overview
This document provides guidance for configuring the KweliVote application to deploy on Azure cloud services.

## Architecture
- **Frontend**: React application deployed on Azure Static Web Apps
- **Backend**: Django REST API deployed on Azure App Service
- **Database**: PostgreSQL Flexible Server on Azure
- **Blockchain Integration**: Avalanche Blockchain (Fuji Testnet)
- **Monitoring**: Azure Application Insights and Log Analytics

## Prerequisites
1. An Azure account with an active subscription
2. Azure CLI installed and configured
3. Git installed locally
4. Node.js 18+ and npm for frontend builds
5. Python 3.12 for backend

## Deployment Steps

### 1. Backend Configuration
Update the following files for Azure deployment:

#### Django Settings Adjustments
Create a production settings file (`kwelivote_app/production_settings.py`) with:

```python
from .settings import *

# Use environment variables provided by App Service
import os

DEBUG = False

ALLOWED_HOSTS = [
    os.environ.get('WEBSITE_HOSTNAME'),
    '<your-backend-app-name>.azurewebsites.net'
]

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    'https://<your-frontend-app-name>.azurestaticapps.net'
]
```

#### Create a requirements.txt file (if not already present)
```
asgiref==3.8.1
Django==5.2
djangorestframework==3.14.0
djangorestframework_simplejwt==5.5.0
django-cors-headers==4.5.0
psycopg2-binary==2.9.10
python-dotenv==1.0.1
pytz==2022.1
PyJWT==2.3.0
sqlparse==0.5.3
tzdata==2024.2
numpy>=1.20.0
scikit-learn>=1.0.0
gunicorn==20.1.0  # For production server
```

#### Create a startup script (startup.sh)
```bash
#!/bin/bash

# Apply database migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn process
gunicorn kwelivote_app.wsgi --log-file -
```

### 2. Frontend Configuration

#### Update API Configuration in the frontend
In `src/utils/api.js`, modify the API_BASE_URL:

```javascript
// API Base URL - Azure App Service URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://<your-backend-app-name>.azurewebsites.net/api';
```

#### Create a .env.production file
```
# Azure Configuration
REACT_APP_API_BASE_URL=https://<your-backend-app-name>.azurewebsites.net/api

# Avalanche Network Configuration
# For Fuji Testnet
REACT_APP_AVALANCHE_API=https://api.avax-test.network
REACT_APP_AVALANCHE_CHAIN_ID=43113
REACT_APP_AVALANCHE_RPC_ENDPOINT=https://api.avax-test.network/ext/bc/C/rpc

# Smart Contract Configuration
REACT_APP_VOTER_DID_CONTRACT_ADDRESS=<your-deployed-contract-address>
```

### 3. Deployment Script
The `azure-deploy.sh` script handles:
- Resource group creation
- PostgreSQL database setup
- App Service configuration for the backend
- Static Web App creation for the frontend

To deploy the application:
1. Make the script executable: `chmod +x azure-deploy.sh`
2. Run the script: `./azure-deploy.sh`
3. Follow the on-screen instructions

### 4. Monitoring and Logging Setup

For comprehensive monitoring of your application, refer to the detailed monitoring guide:

```
/home/quest/myrepos/KweliVote/docs/azure-monitoring-guide.md
```

The monitoring setup provides:

1. **Application Performance Monitoring**:
   - Frontend and backend performance tracking
   - Error detection and reporting
   - User experience monitoring
   - Blockchain transaction tracking

2. **Database Monitoring**:
   - Performance metrics and query analysis
   - Connection monitoring
   - Storage usage tracking

3. **Cost Management**:
   - Monthly cost reporting
   - Budget alerts
   - Resource optimization recommendations

4. **Custom Dashboards**:
   - Application dashboard template
   - Database monitoring dashboard 
   - Blockchain transaction monitoring

To set up monitoring:

```bash
# After running azure-deploy.sh, set up monitoring
cd /home/quest/myrepos/KweliVote
az monitor app-insights component create \
  --app kwelivote-insights \
  --resource-group kwelivote-rg \
  --location westeurope

# Configure dashboard
az portal dashboard create \
  --resource-group kwelivote-rg \
  --name KweliVoteMonitoring \
  --input-path ./monitoring/dashboard-template.json
```

### 5. Post-Deployment Tasks

1. **Configure GitHub Actions for CI/CD**:
   - Connect your GitHub repository to Azure Static Web Apps
   - Set up workflows for automatic deployments

2. **Set up backend deployment**:
   - Configure local Git deployment or GitHub Actions

3. **Database Migration**:
   - Apply Django migrations to the Azure database
   - Load initial data if needed

4. **Monitor and Test**:
   - Verify all services are working correctly
   - Check frontend-backend communication
   - Test blockchain integration

## Troubleshooting
- **CORS Issues**: Ensure CORS is correctly configured in the backend settings
- **Database Connection**: Verify connection strings and firewall rules
- **Azure App Service Logs**: Check logs in the Azure Portal for backend issues
- **Static Web App Build Errors**: Review GitHub Actions logs

## Additional Resources
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Database for PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
