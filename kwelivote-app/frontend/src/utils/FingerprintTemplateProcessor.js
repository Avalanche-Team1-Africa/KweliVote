import apiServices from './api';

/**
 * Process a fingerprint template using the authenticated API endpoint
 * 
 * @param {Object} fingerprintTemplate - The fingerprint template to process
 * @returns {Promise<Object>} - The processing result from the API
 */
export const processFingerprintTemplate = async (fingerprintTemplate) => {
  try {
    // Validate nationalId is present
    if (!fingerprintTemplate.nationalId) {
      console.error('National ID is required for fingerprint processing');
      throw new Error('National ID is required for fingerprint processing');
    }
    
    console.log(`Processing fingerprint template for national ID: ${fingerprintTemplate.nationalId}`);
    
    // Use the authenticated API endpoint to process the template
    const result = await apiServices.fingerprint.processTemplate(fingerprintTemplate);
    console.log(`Successfully processed fingerprint template for national ID: ${fingerprintTemplate.nationalId}`);
    return result;
  } catch (error) {
    console.error(`Error processing fingerprint template: ${error.message}`);
    // Check if it's an authentication error
    if (error.message && error.message.includes('token')) {
      throw new Error('Authentication error: Invalid or expired token. Please login again.');
    }
    throw error;
  }
};

export default processFingerprintTemplate;