// No imports needed as we're using hardcoded URL

/**
 * Process an uploaded fingerprint image and convert it to a template
 * 
 * This utility sends the fingerprint image to the verify-fingerprint API endpoint
 * and returns a standardized template structure
 * 
 * @param {Object} imageData - Object containing the image data in base64 format
 * @param {string} nationalId - The national ID to associate with the fingerprint
 * @returns {Promise<Object>} - The processed template from the API
 */
const processUploadedFingerprintImage = async (imageData, nationalId) => {
  try {
    if (!imageData || !imageData.image) {
      throw new Error('Image data is required');
    }
    
    if (!nationalId) {
      throw new Error('National ID is required for fingerprint processing');
    }
    
    console.log(`Processing uploaded fingerprint image for national ID: ${nationalId}`);
    
    // For the verify-fingerprint endpoint, we can use the image data directly
    // No need to convert to blob, as we'll send the base64 image in JSON
    
    // Make sure the image format is supported
    const dataUriParts = imageData.image.split(',');
    const mimeString = dataUriParts[0].split(':')[1].split(';')[0];
    
    const supportedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'];
    if (!supportedTypes.includes(mimeString)) {
      console.error('Unsupported image type:', mimeString);
      throw new Error(`Unsupported image format: ${mimeString}. Please use JPEG, PNG, BMP, or TIFF.`);
    }
    
    // Create the payload in the format required by the verify-fingerprint endpoint
    const payload = {
      fingerprints: [
        {
          finger: "Scan 1",
          sample: imageData.image // Already in base64 format from the upload
        }
      ],
      nationalId: nationalId,
      extract_only: true
    };
    
    // Log details about the request (without the actual image data for privacy)
    console.log('Sending image to verify-fingerprint API:', {
      endpoint: `http://127.0.0.1:8000/api/fingerprints/verify-fingerprint/`,
      method: 'POST',
      payloadStructure: {
        fingerprints: '1 item array with finger and sample',
        nationalId: nationalId,
        extract_only: true
      },
      sampleDataLength: imageData.image.length
    });
    
    // Get authentication token from session storage
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    const token = userInfo.token;
    
    // Send the JSON payload to the verify-fingerprint endpoint
    const response = await fetch(`http://127.0.0.1:8000/api/fingerprints/verify-fingerprint/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '' // Include token if available
      },
      body: JSON.stringify(payload)
    });
    
    // Handle non-success responses
    if (!response.ok) {
      // Try to get more detailed error information from the response
      const text = await response.text();
      console.error('Error response text:', text);
      
      try {
        // Try to parse as JSON first
        const errorData = JSON.parse(text);
        
        // Handle specific error messages from the backend
        if (errorData.error && errorData.error.includes("too many values to unpack")) {
          throw new Error('The fingerprint image could not be processed. The image format is not compatible with the minutiae extraction algorithm. Please try a clearer image or use the fingerprint scanner instead.');
        }
        
        throw new Error(`Server error: ${errorData.message || errorData.error || JSON.stringify(errorData)}`);
      } catch (e) {
        // If not JSON or if there was an error during JSON parsing
        if (text.includes("too many values to unpack")) {
          throw new Error('The fingerprint image could not be processed. The image may not contain clear fingerprint features. Please try a clearer image or use the fingerprint scanner instead.');
        }
        
        // If not a specific known error, use the general text response
        throw new Error(`Server error (${response.status}): ${text || response.statusText}`);
      }
    }
    
    // Parse the response
    let data;
    try {
      data = await response.json();
      console.log('Template data received from API:', data);
      
      // Log more detailed information about the response structure
      console.log('Response structure:', {
        hasExtractedTemplate: !!data.extracted_template,
        keys: Object.keys(data),
        extractedTemplateKeys: data.extracted_template ? Object.keys(data.extracted_template) : []
      });
    } catch (error) {
      console.error('Error parsing API response:', error);
      throw new Error('Invalid response format from the server: ' + error.message);
    }
    
    // Validate the response data
    if (!data) {
      throw new Error('No data received from server');
    }
    
    // Check for specific error messages in the response
    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(`API Error: ${data.error}`);
    }
    
    // Extract template data from the verify-fingerprint response
    // The verify-fingerprint endpoint with extract_only=true returns data in a different format
    let templateSource = data;
    if (data.extracted_template) {
      templateSource = data.extracted_template;
    }
    
    // Ensure we have the required template data
    if (!templateSource.iso_template_base64) {
      console.error('Missing ISO template data in API response:', templateSource);
      throw new Error('Missing template data in API response');
    }
    
    // Create a standardized template object that matches what the application expects
    // Format it the same way as the fingerprint scanner output from FingerprintEnrollment
    const templateData = {
      id: templateSource.id || templateSource.national_id || nationalId,
      iso_template_base64: templateSource.iso_template_base64,
      xyt_data: templateSource.xyt_data,
      processing_status: templateSource.processing_status || 'completed',
      nationalId: nationalId,
      userId: nationalId, // For compatibility with FingerprintEnrollment
      fingerprints: [
        {
          finger: "Scan 1",
          sample: imageData.image, // Include the original base64 image
          quality: "Good", // Default quality for uploaded image
          timestamp: new Date().toISOString()
        }
      ],
      // Add additional fields that match what FingerprintEnrollment produces
      iso_template_id: templateSource.id || templateSource.national_id || nationalId,
      finalizedAt: new Date().toISOString(),
      error_message: templateSource.error_message || null,
      metadata: templateSource.metadata || {},
      // Add additional fields from FingerprintEnrollment template
      formatInfo: {
        name: "ANSI-INCITS 378-2004",
        type: "ISO/IEC 19794-2",
        description: "Finger Minutiae Record Format"
      },
      createdAt: new Date().toISOString()
    };
    
    // Log the final template data that will be returned
    console.log('Final template data structure:', {
      id: templateData.id,
      nationalId: templateData.nationalId,
      userId: templateData.userId,
      has_fingerprints: templateData.fingerprints.length > 0,
      has_iso_template: !!templateData.iso_template_base64,
      iso_template_length: templateData.iso_template_base64 ? templateData.iso_template_base64.length : 0
    });
    
    return templateData;
  } catch (error) {
    console.error(`Error processing fingerprint image: ${error.message}`);
    throw error;
  }
};

export default processUploadedFingerprintImage;
