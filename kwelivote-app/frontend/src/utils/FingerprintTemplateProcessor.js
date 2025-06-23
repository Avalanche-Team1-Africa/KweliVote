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
    
    // Log detailed template information for debugging
    console.log('Fingerprint template being sent to backend:', {
      id: fingerprintTemplate.id,
      userId: fingerprintTemplate.userId,
      nationalId: fingerprintTemplate.nationalId,
      iso_template_id: fingerprintTemplate.iso_template_id,
      has_iso_template: !!fingerprintTemplate.iso_template_base64,
      template_length: fingerprintTemplate.iso_template_base64 ? fingerprintTemplate.iso_template_base64.length : 0,
      fingerprints_count: fingerprintTemplate.fingerprints ? fingerprintTemplate.fingerprints.length : 0,
      has_xyt_data: !!fingerprintTemplate.xyt_data,
      finalizedAt: fingerprintTemplate.finalizedAt
    });
    
    // For more detailed debugging, uncomment this to show the full template (warning: can be large)
    // console.log('Full template data:', JSON.stringify(fingerprintTemplate, null, 2));
    
    // Use the authenticated API endpoint to process the template
    const result = await apiServices.fingerprint.processTemplate(fingerprintTemplate);
    console.log(`Successfully processed fingerprint template for national ID: ${fingerprintTemplate.nationalId}`);
    console.log('Backend processing result summary:', {
      success: !!result,
      resultType: result ? (result.extracted_template ? 'extracted_template' : 'direct') : 'unknown',
      has_iso_template: result ? (result.extracted_template ? !!result.extracted_template.iso_template_base64 : !!result.iso_template_base64) : false
    });
    
    // Handle the response format from the verification endpoint with extract_only=true
    // The verification endpoint returns: { extracted_template: { ... } }
    // But the frontend expects the template data directly
    if (result && result.extracted_template) {
      // Log detailed information about the extracted template
      console.log('Extracted template received from backend:', {
        national_id: result.extracted_template.national_id,
        has_iso_template: !!result.extracted_template.iso_template_base64,
        template_length: result.extracted_template.iso_template_base64 ? result.extracted_template.iso_template_base64.length : 0,
        has_xyt_data: !!result.extracted_template.xyt_data,
        metadata: result.extracted_template.metadata
      });
      
      // Return the extracted template data in the expected format
      const formattedResult = {
        id: result.extracted_template.national_id, // Use national_id as id for compatibility
        processing_status: 'completed', // Frontend expects 'completed', not 'extracted'
        iso_template_base64: result.extracted_template.iso_template_base64,
        xyt_data: result.extracted_template.xyt_data,
        national_id: result.extracted_template.national_id,
        metadata: result.extracted_template.metadata,
        error_message: null
      };
      
      console.log('Formatted template to return to frontend:', {
        id: formattedResult.id,
        processing_status: formattedResult.processing_status,
        has_iso_template: !!formattedResult.iso_template_base64,
        has_xyt_data: !!formattedResult.xyt_data
      });
      
      return formattedResult;
    }
    
    // If the response is already in the expected format, return as-is
    console.log('Response already in expected format, returning as-is:', {
      id: result.id,
      processing_status: result.processing_status,
      has_iso_template: !!result.iso_template_base64,
      has_xyt_data: !!result.xyt_data
    });
    return result;
  } catch (error) {
    console.error(`Error processing fingerprint template: ${error.message}`);
    
    // Log error details for debugging
    console.error('Error context:', {
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      nationalId: fingerprintTemplate?.nationalId,
      templateAvailable: !!fingerprintTemplate,
      apiServiceAvailable: !!apiServices?.fingerprint?.processTemplate
    });
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('token')) {
      console.error('Authentication error detected');
      throw new Error('Authentication error: Invalid or expired token. Please login again.');
    }
    
    // Check for network errors
    if (error.message && (error.message.includes('network') || error.message.includes('fetch'))) {
      console.error('Network error detected');
      throw new Error('Network error: Unable to connect to the fingerprint processing service. Please check your connection and try again.');
    }
    
    throw error;
  }
};

export default processFingerprintTemplate;