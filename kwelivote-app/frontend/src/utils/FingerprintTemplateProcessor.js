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
    
    // Handle the response format from the verification endpoint with extract_only=true
    // The verification endpoint returns: { extracted_template: { ... } }
    // But the frontend expects the template data directly
    if (result && result.extracted_template) {
      // Return the extracted template data in the expected format
      return {
        id: result.extracted_template.national_id, // Use national_id as id for compatibility
        processing_status: 'completed', // Frontend expects 'completed', not 'extracted'
        iso_template_base64: result.extracted_template.iso_template_base64,
        xyt_data: result.extracted_template.xyt_data,
        national_id: result.extracted_template.national_id,
        metadata: result.extracted_template.metadata,
        error_message: null
      };
    }
    
    // If the response is already in the expected format, return as-is
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