#!/bin/bash
# Azure Cost Management Report for KweliVote

# Configuration
RESOURCE_GROUP="kwelivote-rg"
START_DATE=$(date -d "30 days ago" +"%Y-%m-%d")
END_DATE=$(date +"%Y-%m-%d")
OUTPUT_DIR="/home/quest/myrepos/KweliVote/monitoring/reports"
REPORT_FILE="${OUTPUT_DIR}/cost-report-$(date +"%Y-%m-%d").json"

# Text formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== KweliVote Azure Cost Management Report =====${NC}"
echo "Generating cost report for resource group: ${RESOURCE_GROUP}"
echo "Period: ${START_DATE} to ${END_DATE}"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Check if logged in to Azure
echo -e "\n${YELLOW}Checking Azure login status...${NC}"
az account show --query name -o tsv > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Not logged in to Azure. Please login first.${NC}"
    az login --use-device-code
else
    echo -e "${GREEN}Already logged in to Azure.${NC}"
fi

# Get cost data
echo -e "\n${YELLOW}Fetching cost data...${NC}"
az costmanagement query --type "ActualCost" \
    --scope "subscriptions/$(az account show --query id -o tsv)/resourceGroups/${RESOURCE_GROUP}" \
    --dataset-aggregation "{totalCost:{name:\"PreTaxCost\",function:\"Sum\"}}" \
    --dataset-grouping name=ResourceGroup type=Dimension \
    --dataset-grouping name=ServiceName type=Dimension \
    --time-period "from=${START_DATE},to=${END_DATE}" \
    --output json > "${REPORT_FILE}"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to fetch cost data.${NC}"
    exit 1
else
    echo -e "${GREEN}Cost data saved to: ${REPORT_FILE}${NC}"
fi

# Extract and display summary information
echo -e "\n${YELLOW}Cost Summary:${NC}"
TOTAL_COST=$(cat "${REPORT_FILE}" | jq -r '.properties.rows[] | select(.[0] == "'${RESOURCE_GROUP}'") | .[2]' | awk '{sum+=$1} END {print sum}')
echo -e "Total cost for ${RESOURCE_GROUP}: ${GREEN}$${TOTAL_COST}${NC}"

# Show cost by service
echo -e "\n${YELLOW}Cost by Service:${NC}"
cat "${REPORT_FILE}" | jq -r '.properties.rows[] | select(.[0] == "'${RESOURCE_GROUP}'") | [.[1], .[2]] | @tsv' | \
    sort -k2 -nr | \
    awk '{printf "'${GREEN}'%-40s $%.2f'${NC}'\n", $1, $2}'

# Generate forecast for next month
echo -e "\n${YELLOW}Generating forecast for the next 30 days...${NC}"
DAILY_AVERAGE=$(echo "${TOTAL_COST} / 30" | bc -l)
FORECAST=$(echo "${DAILY_AVERAGE} * 30" | bc -l)
echo -e "Estimated cost for next 30 days: ${GREEN}$$(printf "%.2f" ${FORECAST})${NC}"

# Cost optimization suggestions
echo -e "\n${YELLOW}Cost Optimization Suggestions:${NC}"
echo -e "${GREEN}1. Consider using reserved instances for App Service and PostgreSQL if stable usage pattern${NC}"
echo -e "${GREEN}2. Check for unused resources and remove them${NC}"
echo -e "${GREEN}3. Use auto-scaling rules to reduce costs during low-traffic periods${NC}"
echo -e "${GREEN}4. Monitor storage usage and clean up unnecessary data${NC}"
echo -e "${GREEN}5. Review Azure Advisor recommendations for cost optimization${NC}"

# Get budget information
echo -e "\n${YELLOW}Budget Information:${NC}"
BUDGET_INFO=$(az consumption budget list --query '[?contains(name, `KweliVote`)]' -o json)
if [ "$(echo ${BUDGET_INFO} | jq length)" -eq 0 ]; then
    echo -e "${RED}No budget defined for KweliVote.${NC}"
    echo -e "Create a budget with:"
    echo -e "az consumption budget create --name \"KweliVote Monthly Budget\" --amount 200 --category cost --time-grain monthly --start-date $(date -d "today" +"%Y-%m-01") --resource-group ${RESOURCE_GROUP}"
else
    echo -e "${GREEN}Budget information:${NC}"
    echo "${BUDGET_INFO}" | jq -r '.[] | "Name: \(.name), Amount: $\(.amount), Period: \(.timePeriod.startDate) to \(.timePeriod.endDate)"'
fi

echo -e "\n${YELLOW}===== Report Complete =====${NC}"
echo -e "Detailed cost report saved to: ${REPORT_FILE}"
