# KweliVote Azure Deployment Checklist

Use this checklist to ensure all steps are completed for a successful Azure deployment.

## Pre-Deployment

- [ ] Local development environment is working correctly
- [ ] All tests pass locally
- [ ] Frontend successfully connects to backend API
- [ ] Blockchain integration is working (contract deployed on Avalanche Fuji testnet)
- [ ] Database schema is finalized
- [ ] Environment variables are documented
- [ ] `.gitignore` is updated to exclude sensitive files

## Azure Resources Setup

- [ ] Log in to Azure CLI: `az login`
- [ ] Create Resource Group: `kwelivote-rg`
- [ ] Create Azure Database for PostgreSQL Flexible Server
- [ ] Create App Service Plan
- [ ] Create Web App for backend
- [ ] Create Static Web App for frontend
- [ ] Create Azure Key Vault for secrets (optional)
- [ ] Configure network security as needed

## Backend Deployment

- [ ] Create `production_settings.py` with Azure-specific configurations
- [ ] Create `startup.sh` script for Azure App Service
- [ ] Update `requirements.txt` to include all dependencies
- [ ] Configure environment variables in App Service:
  - [ ] `DB_NAME`
  - [ ] `DB_USER`
  - [ ] `DB_PASSWORD`
  - [ ] `DB_HOST`
  - [ ] `DB_PORT`
  - [ ] `SECRET_KEY`
  - [ ] `DEBUG=False`
  - [ ] `ALLOWED_HOSTS`
  - [ ] `DJANGO_SETTINGS_MODULE=kwelivote_app.production_settings`
- [ ] Configure startup command in App Service: `startup.sh`
- [ ] Deploy code to App Service
- [ ] Run database migrations
- [ ] Create superuser account
- [ ] Verify API endpoints are accessible

## Frontend Deployment

- [ ] Update `.env.production` with:
  - [ ] Backend API URL
  - [ ] Avalanche blockchain configuration
  - [ ] Contract addresses
- [ ] Build React application: `npm run build`
- [ ] Deploy to Azure Static Web App
- [ ] Configure environment variables in Static Web App:
  - [ ] `REACT_APP_API_BASE_URL`
  - [ ] `REACT_APP_AVALANCHE_*` variables
  - [ ] `REACT_APP_VOTER_DID_CONTRACT_ADDRESS`
- [ ] Configure GitHub Actions for CI/CD (if using)
- [ ] Verify frontend is accessible and loads correctly

## Blockchain Integration

- [ ] Ensure contract is deployed to Avalanche Fuji testnet
- [ ] Verify contract address is correctly set in frontend configuration
- [ ] Test contract interaction from deployed frontend
- [ ] Confirm transactions are being recorded on-chain
- [ ] Monitor gas usage and wallet balance

## Testing Deployed Application

- [ ] Test user registration flows
- [ ] Test authentication and authorization
- [ ] Test voter registration with blockchain integration
- [ ] Test biometric processing capabilities
- [ ] Verify all API endpoints are working
- [ ] Check mobile responsiveness
- [ ] Verify CORS settings are correct

## Post-Deployment

- [ ] Set up monitoring and alerting
- [ ] Configure logging
- [ ] Set up backups for database
- [ ] Document deployment architecture
- [ ] Create operational runbook for maintenance
- [ ] Review security settings
- [ ] Set up SSL/TLS certificates
- [ ] Update documentation with production URLs

## Performance Optimization

- [ ] Enable CDN for static assets
- [ ] Configure caching policies
- [ ] Set up database optimization/indexing
- [ ] Configure auto-scaling rules if needed

## Rollback Plan

- [ ] Document steps to roll back deployment if needed
- [ ] Create database backups before major changes
- [ ] Document contract version history

## Final Approval

- [ ] Get stakeholder sign-off
- [ ] Perform final security review
- [ ] Schedule go-live announcement
