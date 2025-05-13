#!/bin/bash
# KweliVote Azure Deployment Validation Script
# This script helps validate that the Azure deployment is functioning correctly

# Configuration - replace with your actual Azure resource names
RESOURCE_GROUP="kwelivote-rg"
BACKEND_APP_NAME="kwelivote-api"
FRONTEND_APP_NAME="kwelivote-web"
DB_SERVER_NAME="kwelivote-db-server"

# Text formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== KweliVote Azure Deployment Validation =====${NC}"
echo "This script will check your Azure resources and verify the deployment."

# Check if az CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit https://docs.microsoft.com/en-us/cli/azure/install-azure-cli for instructions."
    exit 1
fi

# Check if logged in to Azure
echo -e "\n${YELLOW}Checking Azure login status...${NC}"
az account show --query name -o tsv > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Not logged in to Azure. Please login first.${NC}"
    az login --use-device-code
else
    echo -e "${GREEN}Already logged in to Azure.${NC}"
fi

# Checking resource group
echo -e "\n${YELLOW}Checking resource group...${NC}"
az group show --name $RESOURCE_GROUP > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Resource group '$RESOURCE_GROUP' not found.${NC}"
    exit 1
else
    echo -e "${GREEN}Resource group '$RESOURCE_GROUP' exists.${NC}"
fi

# Check App Service
echo -e "\n${YELLOW}Checking backend App Service...${NC}"
BACKEND_STATUS=$(az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query state -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend App Service '$BACKEND_APP_NAME' not found.${NC}"
else
    echo -e "${GREEN}Backend App Service '$BACKEND_APP_NAME' exists.${NC}"
    echo -e "Status: ${BACKEND_STATUS}"
    
    # Get the backend URL
    BACKEND_URL=$(az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
    echo -e "URL: https://${BACKEND_URL}"
    
    # Check if the backend is responding
    echo -e "\n${YELLOW}Checking if backend API is responding...${NC}"
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${BACKEND_URL}/api/health-check/)
    if [[ $RESPONSE_CODE -ge 200 && $RESPONSE_CODE -lt 300 ]]; then
        echo -e "${GREEN}Backend API is responding with status code: ${RESPONSE_CODE}${NC}"
    else
        echo -e "${RED}Backend API returned status code: ${RESPONSE_CODE}${NC}"
    fi
fi

# Check Static Web App
echo -e "\n${YELLOW}Checking frontend Static Web App...${NC}"
FRONTEND_URL=$(az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend Static Web App '$FRONTEND_APP_NAME' not found.${NC}"
else
    echo -e "${GREEN}Frontend Static Web App '$FRONTEND_APP_NAME' exists.${NC}"
    echo -e "URL: https://${FRONTEND_URL}"
    
    # Check if frontend is responding
    echo -e "\n${YELLOW}Checking if frontend is responding...${NC}"
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${FRONTEND_URL})
    if [[ $RESPONSE_CODE -ge 200 && $RESPONSE_CODE -lt 300 ]]; then
        echo -e "${GREEN}Frontend is responding with status code: ${RESPONSE_CODE}${NC}"
    else
        echo -e "${RED}Frontend returned status code: ${RESPONSE_CODE}${NC}"
    fi
fi

# Check Database server
echo -e "\n${YELLOW}Checking PostgreSQL database server...${NC}"
DB_STATUS=$(az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --query state -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}PostgreSQL database server '$DB_SERVER_NAME' not found.${NC}"
else
    echo -e "${GREEN}PostgreSQL database server '$DB_SERVER_NAME' exists.${NC}"
    echo -e "Status: ${DB_STATUS}"
    
    # List databases
    echo -e "\n${YELLOW}Listing databases...${NC}"
    az postgres flexible-server db list --server-name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP -o table
fi

# Check environment variables for backend
echo -e "\n${YELLOW}Checking backend environment variables...${NC}"
BACKEND_VARS=$(az webapp config appsettings list --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query "[].{Name:name}" -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}Could not retrieve backend environment variables.${NC}"
else
    echo -e "${GREEN}Backend environment variables:${NC}"
    echo "$BACKEND_VARS" | grep -v PASSWORD | grep -v SECRET | sort
    
    # Check for required variables
    for VAR in "DB_NAME" "DB_HOST" "DJANGO_SETTINGS_MODULE"; do
        if echo "$BACKEND_VARS" | grep -q "$VAR"; then
            echo -e "${GREEN}✓ $VAR is set${NC}"
        else
            echo -e "${RED}✗ $VAR is not set${NC}"
        fi
    done
fi

# Test frontend to backend connectivity
echo -e "\n${YELLOW}Testing frontend to backend connectivity...${NC}"
echo "Please visit the frontend URL in your browser and try to log in or access API endpoints."
echo "Frontend URL: https://${FRONTEND_URL}"
echo "Backend API URL: https://${BACKEND_URL}/api"

# Blockchain integration check
echo -e "\n${YELLOW}Checking blockchain integration...${NC}"
echo "To verify blockchain integration:"
echo "1. Log into the application"
echo "2. Register a new voter to trigger a blockchain transaction"
echo "3. Check the transaction status in the application"
echo "4. Verify the transaction on Avalanche explorer: https://testnet.snowtrace.io"

echo -e "\n${GREEN}Deployment validation completed.${NC}"
echo -e "${YELLOW}For more detailed checks, refer to the Azure Deployment Checklist.${NC}"
