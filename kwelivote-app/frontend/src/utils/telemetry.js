// KweliVote Application Insights telemetry utility
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Initialize as null - will be set when initialized
let appInsights = null;

/**
 * Initialize Application Insights with the connection string from environment variables
 * @returns {boolean} True if initialization was successful, false otherwise
 */
export const initializeAppInsights = () => {
  // Only initialize if connection string is available and not already initialized
  if (!appInsights && process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING) {
    appInsights = new ApplicationInsights({
      config: {
        connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING,
        enableAutoRouteTracking: true,
        enableAjaxErrorStatusText: true,
        enableCorsCorrelation: true,
        correlationHeaderExcludedDomains: ['api.avax-test.network'], // Don't add correlation headers to blockchain RPC calls
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        maxBatchInterval: 5000, // Send telemetry every 5 seconds
        disableFetchTracking: false, // Track all fetch calls
      }
    });
    
    // Start the SDK
    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Track initial page view
    
    // Add global error tracking
    window.addEventListener('error', (event) => {
      trackException(event.error);
    });
    
    // Add unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', (event) => {
      trackException(new Error(`Unhandled Promise rejection: ${event.reason}`));
    });
    
    console.log('Application Insights initialized');
    return true;
  }
  return false;
};

/**
 * Track a custom event
 * @param {string} name - Name of the event
 * @param {object} properties - Additional properties to track
 */
export const trackEvent = (name, properties = {}) => {
  if (appInsights) {
    appInsights.trackEvent({ name }, properties);
  }
};

/**
 * Track an exception
 * @param {Error} error - The error object
 * @param {object} properties - Additional properties to track
 */
export const trackException = (error, properties = {}) => {
  if (appInsights) {
    appInsights.trackException({ exception: error }, properties);
  }
};

/**
 * Track a blockchain transaction
 * @param {string} txId - Transaction ID/hash
 * @param {string} operation - Type of operation (register, update, etc.)
 * @param {string} status - Transaction status (pending, confirmed, failed)
 * @param {object} details - Additional transaction details
 */
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

/**
 * Track user authentication events
 * @param {string} action - The auth action (login, logout, etc.)
 * @param {string} userId - User identifier (anonymized)
 * @param {object} details - Additional details
 */
export const trackAuth = (action, userId, details = {}) => {
  if (appInsights) {
    // Hash or otherwise anonymize the userId before tracking
    const hashedId = userId ? btoa(userId).substring(0, 8) : 'anonymous';
    
    appInsights.trackEvent({ 
      name: 'Authentication' 
    }, {
      action,
      userId: hashedId,
      ...details
    });
  }
};

/**
 * Track voter registration or update events
 * @param {string} action - Registration action (new, update)
 * @param {string} voterId - Voter ID (anonymized)
 * @param {object} details - Additional details
 */
export const trackVoterRegistration = (action, voterId, details = {}) => {
  if (appInsights) {
    // Hash or otherwise anonymize the voterId before tracking
    const hashedId = voterId ? btoa(voterId).substring(0, 8) : 'unknown';
    
    appInsights.trackEvent({ 
      name: 'VoterRegistration' 
    }, {
      action,
      voterId: hashedId,
      ...details
    });
  }
};

/**
 * Track performance metrics for critical operations
 * @param {string} operationName - Name of the operation
 * @param {number} durationMs - Duration in milliseconds
 * @param {object} details - Additional details
 */
export const trackPerformance = (operationName, durationMs, details = {}) => {
  if (appInsights) {
    appInsights.trackMetric({ 
      name: operationName,
      average: durationMs
    }, {
      ...details
    });
  }
};

// Export the telemetry functions
export default {
  initializeAppInsights,
  trackEvent,
  trackException,
  trackBlockchainTransaction,
  trackAuth,
  trackVoterRegistration,
  trackPerformance
};
