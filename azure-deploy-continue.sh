#!/bin/bash
# KweliVote Azure Deployment Script - Continued from previous run

# Exit on error
set -e

echo "=== KweliVote Azure Deployment (Continued) ==="
echo "This script will deploy the KweliVote application to Azure."

# Configuration variables
RESOURCE_GROUP="kwelivote-rg-north"
LOCATION="northeurope"  # Changed to North Europe region
APP_NAME="kwelivote"
DB_SERVER_NAME="${APP_NAME}-db-server"
DB_NAME="kwelivote_db"
DB_USERNAME="kwelivote_admin"  # Change this to your preferred database username
DB_PASSWORD="P@ssw0rd$(date +%s)"  # Generating a unique password with timestamp
BACKEND_APP_NAME="${APP_NAME}-api"
FRONTEND_APP_NAME="${APP_NAME}-web"

echo "Using resource group: $RESOURCE_GROUP in $LOCATION"
echo "Database server: $DB_SERVER_NAME, Database: $DB_NAME"
echo "Backend App: $BACKEND_APP_NAME"
echo "Frontend App: $FRONTEND_APP_NAME"

# Create Resource Group
echo "Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Database for PostgreSQL
echo "Creating Azure Database for PostgreSQL..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_USERNAME \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15

# Create the database
echo "Creating database: $DB_NAME..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Allow Azure services to access the database
echo "Configuring database firewall..."
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAllAzureIps \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create App Service Plan
echo "Creating App Service Plan..."
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name "${APP_NAME}-plan" \
  --sku B1 \
  --is-linux

# Create Backend Web App
echo "Creating Backend Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $BACKEND_APP_NAME \
  --runtime "PYTHON:3.12" \
  --deployment-local-git

# Configure Backend App Settings
echo "Configuring Backend App Settings..."
POSTGRESQL_CONNECTION_STRING="postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}"
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
  DB_NAME=$DB_NAME \
  DB_USER=$DB_USERNAME \
  DB_PASSWORD=$DB_PASSWORD \
  DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com" \
  DB_PORT=5432 \
  SECRET_KEY="$(openssl rand -base64 32)" \
  DEBUG=False \
  ALLOWED_HOSTS="${BACKEND_APP_NAME}.azurewebsites.net" \
  DATABASE_URL="$POSTGRESQL_CONNECTION_STRING" \
  DJANGO_SETTINGS_MODULE="kwelivote_app.settings" \
  BIOMETRIC_FUSION_ENABLED=True \
  TEMPLATE_FUSION_MIN_SAMPLES=2 \
  TEMPLATE_FUSION_EPS=12 \
  BIOMETRIC_TEMP_STORAGE=/home/site/wwwroot/tmp \
  TEMPLATE_STORAGE_DAYS=1 \
  BIOMETRIC_FUSION_ENABLED=True \
  TEMPLATE_FUSION_MIN_SAMPLES=2 \
  TEMPLATE_FUSION_EPS=12

# Create Static Web App for Frontend
echo "Creating Static Web App for Frontend..."
az staticwebapp create \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP_NAME \
  --location $LOCATION \
  --source https://github.com/yourusername/KweliVote \
  --branch main \
  --app-location "/kwelivote-app/frontend" \
  --output-location "build" \
  --api-location ""

# Note: You'll need to set up the GitHub Actions workflow for the Static Web App later
# or use a different deployment method like manual build and deploy

# Set up Application Insights for monitoring
echo "Setting up Application Insights for monitoring..."
az monitor app-insights component create \
  --app "kwelivote-insights" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Get the Application Insights connection string
APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app "kwelivote-insights" \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

# Configure Application Insights for the backend
echo "Configuring Application Insights for the backend..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
  APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONNECTION_STRING"

# Create action group for alerts
echo "Creating action group for alerts..."
az monitor action-group create \
  --resource-group $RESOURCE_GROUP \
  --name "developers" \
  --short-name "devs" \
  --email-receiver name=developers email=admin@kwelivote.org

# Set up biometric processing monitoring dashboard
echo "Setting up biometric processing monitoring dashboard..."
az portal dashboard create \
  --resource-group $RESOURCE_GROUP \
  --name "KweliVoteBiometricMonitoring" \
  --input-path "./monitoring/biometric-dashboard-template.json" \
  --location $LOCATION

echo "=== Deployment Summary ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Database Server: $DB_SERVER_NAME"
echo "Database: $DB_NAME"
echo "Database Username: $DB_USERNAME"
echo "Database Password: $DB_PASSWORD"
echo "Backend App: https://${BACKEND_APP_NAME}.azurewebsites.net"
echo "Frontend App: Will be available after GitHub Actions deployment"
echo "Application Insights: kwelivote-insights"
echo "Biometric Monitoring Dashboard: KweliVoteBiometricMonitoring"

echo "Next Steps:"
echo "1. Update the frontend API_BASE_URL to point to your Azure backend"
echo "2. Configure GitHub repository for Static Web App deployment"
echo "3. Add your blockchain contract address to the frontend environment"
echo "4. Deploy backend code using Git or GitHub Actions"

# Save the configuration to a file for reference
echo "Saving configuration to azure-deployment-config.txt..."
cat > azure-deployment-config.txt << EOL
Resource Group: $RESOURCE_GROUP
Database Server: $DB_SERVER_NAME
Database: $DB_NAME
Database Username: $DB_USERNAME
Database Password: $DB_PASSWORD
Backend App: https://${BACKEND_APP_NAME}.azurewebsites.net
Frontend App: ${FRONTEND_APP_NAME}
EOL

echo "Deployment script completed!"
