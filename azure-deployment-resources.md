# KweliVote Azure Deployment Resources

## Overview

This document catalogs all the Azure deployment resources created for the KweliVote application. Use this as a reference for understanding what files are available and their purposes.

## Deployment Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `/azure-deploy.sh` | Main deployment script for creating all Azure resources | `chmod +x azure-deploy.sh && ./azure-deploy.sh` |
| `/azure-deployment-validate.sh` | Validates the deployment and checks resource health | `chmod +x azure-deployment-validate.sh && ./azure-deployment-validate.sh` |
| `/monitoring/azure-cost-report.sh` | Generates cost reports for Azure resources | `chmod +x monitoring/azure-cost-report.sh && ./monitoring/azure-cost-report.sh` |

## Configuration Files

| File | Purpose |
|------|---------|
| `/kwelivote-app/backend/kwelivote_app/production_settings.py` | Django production settings for Azure |
| `/kwelivote-app/backend/kwelivote_app/health_checks.py` | Health check endpoints for monitoring in Azure |
| `/kwelivote-app/backend/startup.sh` | App Service startup script for the backend |
| `/kwelivote-app/frontend/.env.production` | Production environment variables for frontend |
| `/.github/workflows/azure-deploy.yml` | GitHub Actions workflow for CI/CD |

## Documentation

| File | Purpose |
|------|---------|
| `/azure-deployment-guide.md` | Main deployment guide with step-by-step instructions |
| `/azure-deployment-checklist.md` | Checklist for tracking deployment progress |
| `/docs/azure-blockchain-integration.md` | Guide for blockchain integration in Azure |
| `/docs/azure-monitoring-guide.md` | Guide for setting up monitoring and logging |
| `/docs/azure-biometric-configuration.md` | Guide for configuring biometric processing in Azure |

## Monitoring Resources

| File | Purpose |
|------|---------|
| `/monitoring/dashboard-template.json` | Template for creating the main monitoring dashboard |
| `/monitoring/database-dashboard-template.json` | Template for database monitoring dashboard |
| `/monitoring/biometric-dashboard-template.json` | Template for biometric processing monitoring dashboard |
| `/kwelivote-app/frontend/src/utils/telemetry.js` | Frontend telemetry implementation for Application Insights |

## File Structure

```
KweliVote/
├── azure-deploy.sh                        # Main deployment script
├── azure-deployment-checklist.md          # Deployment checklist
├── azure-deployment-guide.md              # Comprehensive deployment guide
├── azure-deployment-validate.sh           # Deployment validation script
├── azure-deployment-resources.md          # This file
├── .github/
│   └── workflows/
│       └── azure-deploy.yml               # CI/CD workflow
├── docs/
│   ├── azure-blockchain-integration.md    # Blockchain integration guide
│   └── azure-monitoring-guide.md          # Monitoring and logging guide
├── kwelivote-app/
│   ├── backend/
│   │   ├── kwelivote_app/
│   │   │   ├── production_settings.py     # Production settings
│   │   │   └── health_checks.py           # Health check endpoints
│   │   └── startup.sh                     # App Service startup script
│   └── frontend/
│       ├── .env.production                # Production environment variables
│       └── src/
│           └── utils/
│               └── telemetry.js           # Application Insights integration
└── monitoring/
    ├── azure-cost-report.sh              # Cost report generation script
    ├── dashboard-template.json           # Main dashboard template
    └── database-dashboard-template.json  # Database dashboard template
```

## Azure Resources Created

The `azure-deploy.sh` script creates the following Azure resources:

1. **Resource Group**: `kwelivote-rg`
2. **PostgreSQL Flexible Server**: `kwelivote-db-server`
3. **Database**: `kwelivote_db`
4. **App Service Plan**: `kwelivote-plan`
5. **Web App (Backend)**: `kwelivote-api`
6. **Static Web App (Frontend)**: `kwelivote-web`
7. **Application Insights**: `kwelivote-insights` (created separately)
8. **Log Analytics Workspace**: `kwelivote-logs` (created separately)
9. **Azure Key Vault**: `kwelivote-keyvault` (optional, for storing secrets)
10. **Custom Dashboards**: Application and database monitoring dashboards

## Next Steps

Once the deployment is complete, you can:

1. Set up continuous integration and deployment
2. Configure alerts and notifications
3. Implement automated scaling rules
4. Set up backup and disaster recovery
5. Optimize costs using the cost management reports
