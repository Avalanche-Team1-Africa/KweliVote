# Azure Monitoring and Logging for KweliVote

This guide outlines how to set up monitoring and logging for the KweliVote application in Azure to ensure you can track its health, performance, and troubleshoot any issues.

## Prerequisites

- Azure resources deployed using the `azure-deploy.sh` script
- Access to the Azure Portal with appropriate permissions

## Application Insights Setup

Azure Application Insights provides powerful monitoring and diagnostics capabilities for your web applications. Follow these steps to configure it:

### 1. Create Application Insights Resource

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app kwelivote-insights \
  --resource-group kwelivote-rg \
  --location westeurope \
  --application-type web
```

### 2. Configure Backend Application

Add Application Insights to the Django backend:

1. Install the required Python package:

```bash
pip install opencensus-ext-azure
```

2. Add to `requirements.txt`:

```
opencensus-ext-azure==1.1.9
```

3. Update `production_settings.py` to include Application Insights:

```python
# Application Insights configuration
APPLICATION_INSIGHTS = {
    'CONNECTION_STRING': os.environ.get('APPLICATIONINSIGHTS_CONNECTION_STRING', '')
}

# Configure logging to send data to Application Insights
if APPLICATION_INSIGHTS['CONNECTION_STRING']:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
            },
            'azure': {
                'class': 'opencensus.ext.azure.log_exporter.AzureLogHandler',
                'connection_string': APPLICATION_INSIGHTS['CONNECTION_STRING'],
            },
        },
        'loggers': {
            'django': {
                'handlers': ['console', 'azure'],
                'level': 'INFO',
            },
            'kwelivote_app': {
                'handlers': ['console', 'azure'],
                'level': 'INFO',
            },
            'blockchain': {
                'handlers': ['console', 'azure'],
                'level': 'INFO',
            },
        },
    }
```

### 3. Configure Frontend Application

For the React frontend:

1. Install the Application Insights JavaScript SDK:

```bash
cd kwelivote-app/frontend
npm install @microsoft/applicationinsights-web --save
```

2. Create a new file `src/utils/telemetry.js`:

```javascript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

let appInsights = null;

export const initializeAppInsights = () => {
  if (!appInsights && process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING) {
    appInsights = new ApplicationInsights({
      config: {
        connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING,
        enableAutoRouteTracking: true,
        enableAjaxErrorStatusText: true,
      }
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
    
    console.log('Application Insights initialized');
    return true;
  }
  return false;
};

export const trackEvent = (name, properties = {}) => {
  if (appInsights) {
    appInsights.trackEvent({ name }, properties);
  }
};

export const trackException = (error, properties = {}) => {
  if (appInsights) {
    appInsights.trackException({ exception: error }, properties);
  }
};

export const trackBlockchainTransaction = (txId, operation, status, details = {}) => {
  if (appInsights) {
    appInsights.trackEvent({ 
      name: 'BlockchainTransaction' 
    }, {
      txId,
      operation,
      status,
      ...details
    });
  }
};

export default {
  initializeAppInsights,
  trackEvent,
  trackException,
  trackBlockchainTransaction
};
```

3. Update `App.js` to initialize Application Insights:

```javascript
import React, { useEffect } from 'react';
import { initializeAppInsights } from './utils/telemetry';

function App() {
  useEffect(() => {
    // Initialize Application Insights
    initializeAppInsights();
  }, []);
  
  // Rest of your App component
}
```

### 4. Configure Environment Variables

Add the Application Insights connection string to your environment:

```bash
# Get the connection string
CONNECTION_STRING=$(az monitor app-insights component show \
  --app kwelivote-insights \
  --resource-group kwelivote-rg \
  --query connectionString \
  --output tsv)

# Set for backend
az webapp config appsettings set \
  --name kwelivote-api \
  --resource-group kwelivote-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING=$CONNECTION_STRING

# Set for frontend
az staticwebapp appsettings set \
  --name kwelivote-web \
  --resource-group kwelivote-rg \
  --setting-names REACT_APP_APPINSIGHTS_CONNECTION_STRING="$CONNECTION_STRING"
```

## Database Monitoring

### 1. Configure Azure Database Metrics

Enable detailed metrics for your PostgreSQL server:

```bash
# Enable Query Store
az postgres flexible-server parameter set \
  --resource-group kwelivote-rg \
  --server-name kwelivote-db-server \
  --name pgms_wait_sampling.enable \
  --value on

# Enable Performance Insights
az postgres flexible-server parameter set \
  --resource-group kwelivote-rg \
  --server-name kwelivote-db-server \
  --name pg_stat_statements.track \
  --value all
```

### 2. Create Database Monitoring Dashboard

```bash
# Create a dashboard for database monitoring
az portal dashboard create \
  --resource-group kwelivote-rg \
  --name KweliVoteDatabaseMonitoring \
  --input-path ./monitoring/database-dashboard-template.json
```

## Blockchain Monitoring

To monitor blockchain transactions specifically:

1. Create a custom logger in the Django backend:

```python
# In kwelivote_app/__init__.py
import logging

# Create a blockchain-specific logger
blockchain_logger = logging.getLogger('blockchain')
```

2. Use the logger in your blockchain integration code:

```python
from kwelivote_app import blockchain_logger

def register_voter_on_blockchain(voter_id, did):
    try:
        # Blockchain transaction code
        transaction_hash = "0x123..."  # Example hash
        blockchain_logger.info(f"Voter registration transaction submitted: {transaction_hash}", 
            extra={
                'voter_id': voter_id,
                'transaction_hash': transaction_hash,
                'operation': 'register_voter'
            })
        return transaction_hash
    except Exception as e:
        blockchain_logger.error(f"Blockchain transaction failed: {str(e)}", 
            extra={
                'voter_id': voter_id,
                'error': str(e),
                'operation': 'register_voter'
            })
        raise
```

3. Set up alerts for blockchain issues:

```bash
# Create an alert rule for blockchain transaction failures
az monitor metrics alert create \
  --name "Blockchain Transaction Failures" \
  --resource-group kwelivote-rg \
  --scopes $(az monitor app-insights component show --resource-group kwelivote-rg --app kwelivote-insights --query id -o tsv) \
  --condition "count requests/failed where customDimensions.operation == 'register_voter' > 5" \
  --evaluation-frequency 5m \
  --window-size 5m \
  --action $(az monitor action-group show --resource-group kwelivote-rg --name developers --query id -o tsv)
```

## Setting Up Alerts

Create alert rules for critical situations:

```bash
# Create an action group for notifications
az monitor action-group create \
  --resource-group kwelivote-rg \
  --name developers \
  --short-name devs \
  --email-receiver admin admin@kwelivote.example.com

# Create alert for high server errors
az monitor metrics alert create \
  --name "High Server Errors" \
  --resource-group kwelivote-rg \
  --scopes $(az webapp show --resource-group kwelivote-rg --name kwelivote-api --query id -o tsv) \
  --condition "count requests/failed > 10" \
  --evaluation-frequency 5m \
  --window-size 5m \
  --action $(az monitor action-group show --resource-group kwelivote-rg --name developers --query id -o tsv)

# Create alert for database connectivity issues
az monitor metrics alert create \
  --name "Database Connectivity Issues" \
  --resource-group kwelivote-rg \
  --scopes $(az postgres flexible-server show --resource-group kwelivote-rg --name kwelivote-db-server --query id -o tsv) \
  --condition "count active_connections < 1" \
  --evaluation-frequency 5m \
  --window-size 5m \
  --action $(az monitor action-group show --resource-group kwelivote-rg --name developers --query id -o tsv)
```

## Setting Up Log Analytics

Configure Log Analytics to collect and analyze logs:

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group kwelivote-rg \
  --workspace-name kwelivote-logs

# Connect App Service to Log Analytics
az webapp log config \
  --resource-group kwelivote-rg \
  --name kwelivote-api \
  --application-logging true \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem \
  --docker-container-logging filesystem
```

## Monitoring Dashboard

Create a comprehensive monitoring dashboard:

```bash
# Create a comprehensive dashboard
az portal dashboard create \
  --resource-group kwelivote-rg \
  --name KweliVoteMonitoring \
  --input-path ./monitoring/dashboard-template.json
```

## Useful Queries for Log Analytics

Once you have logs flowing into Log Analytics, you can use these queries:

### Backend Performance

```kusto
requests
| where cloud_RoleName == "kwelivote-api"
| summarize avg(duration), percentile(duration, 95) by name
| order by percentile_duration_95 desc
```

### Blockchain Transactions

```kusto
traces
| where customDimensions.operation startswith "blockchain_"
| summarize count() by operation=tostring(customDimensions.operation), status=tostring(customDimensions.status)
```

### Failed Voter Registrations

```kusto
traces
| where message contains "Voter registration" and severityLevel >= 3
| project timestamp, message, voter_id=tostring(customDimensions.voter_id), error=tostring(customDimensions.error)
```

## Cost Management

Monitor and manage costs:

```bash
# Set up a budget alert
az consumption budget create \
  --name "KweliVote Monthly Budget" \
  --amount 200 \
  --category cost \
  --time-grain monthly \
  --start-date $(date -d "today" +"%Y-%m-01") \
  --resource-group kwelivote-rg
```

## Automation Scripts

For automating the monitoring setup, we've provided several helpful scripts:

1. **Monitor Dashboard Setup**:
   - Use `/home/quest/myrepos/KweliVote/monitoring/dashboard-template.json` to create the main monitoring dashboard
   - Use `/home/quest/myrepos/KweliVote/monitoring/database-dashboard-template.json` for database-specific monitoring

2. **Cost Management**:
   - Run `/home/quest/myrepos/KweliVote/monitoring/azure-cost-report.sh` monthly to track expenses
   - This script generates detailed cost reports for review and planning

3. **Automation with Azure CLI**:
   - All commands in this guide can be automated using Azure CLI scripts
   - Consider setting up CI/CD pipelines for continuous monitoring updates

## Next Steps

1. Review the [Azure Monitor documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/overview) for advanced features
2. Implement a detailed [disaster recovery plan](https://docs.microsoft.com/en-us/azure/site-recovery/site-recovery-overview)
3. Configure [automated scaling rules](https://docs.microsoft.com/en-us/azure/app-service/manage-automatic-scaling) based on usage patterns
4. Set up [alerting for blockchain events](https://docs.microsoft.com/en-us/azure/application-insights/app-insights-alerts) to stay informed about critical transactions
5. Regularly review the cost management reports and optimize resources as needed
