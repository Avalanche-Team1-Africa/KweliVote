import React, { useState, useRef } from 'react';
import FingerprintEnrollment from '../voter/FingerprintEnrollment';
import processUploadedFingerprintImage from '../../utils/FingerprintImageProcessor';

/**
 * BiometricInput - A shared component that provides a toggle between
 * fingerprint scanning and file upload modes for biometric input.
 * 
 * @param {Object} props
 * @param {string} props.nationalId - The national ID to link with the biometric data
 * @param {Function} props.onBiometricCaptured - Callback triggered when biometric data is captured
 */
const BiometricInput = ({ nationalId, onBiometricCaptured }) => {
  // State for the toggle between scan and upload
  const [inputMode, setInputMode] = useState('scan'); // 'scan' or 'upload'
  const [fingerprintImage, setFingerprintImage] = useState(null);
  const [processedTemplate, setProcessedTemplate] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid fingerprint image (JPEG, PNG, BMP, or TIFF)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds 5MB. Please upload a smaller file.');
        return;
      }
      
      // Log file details for debugging
      console.log('Selected fingerprint file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      setFingerprintImage(file);
      setError('');
      
      // Load the image to check dimensions and quality before processing
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        console.log('Image dimensions:', { width: img.width, height: img.height });
        
        // Check if image dimensions are reasonable for a fingerprint
        if (img.width < 100 || img.height < 100) {
          setError('Image is too small to contain valid fingerprint data. Please upload a larger image.');
          URL.revokeObjectURL(objectUrl);
          return;
        }
        
        // Check if image is unreasonably large
        if (img.width > 2000 || img.height > 2000) {
          console.warn('Image is very large, might cause processing issues');
        }
        
        // Process the file - convert to a format compatible with the template processor
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = {
            image: event.target.result,
            format: file.type,
            filename: file.name,
            width: img.width,
            height: img.height
          };
          
          // Call the API to process the file to a template
          processFingerprintImage(imageData);
        };
        reader.readAsDataURL(file);
        
        URL.revokeObjectURL(objectUrl);
      };
      
      img.onerror = () => {
        setError('Failed to load the image. The file may be corrupted.');
        URL.revokeObjectURL(objectUrl);
      };
      
      img.src = objectUrl;
    }
  };

  // Process the fingerprint image to a template
  const processFingerprintImage = async (imageData) => {
    setIsProcessing(true);
    setError(''); // Clear any previous errors
    
    console.log('Processing fingerprint image, format:', imageData.format);
    console.log('Image data length:', imageData.image ? imageData.image.length : 'No image data');
    
    try {
      // Use our utility function to process the image
      const templateData = await processUploadedFingerprintImage(imageData, nationalId);
      
      // Validate the template data
      if (!templateData || !templateData.iso_template_base64) {
        throw new Error('Invalid template data received from the server');
      }
      
      // Additional validation to ensure template format matches scanner format
      if (!templateData.fingerprints || !templateData.fingerprints.length || 
          !templateData.formatInfo || !templateData.createdAt) {
        console.warn('Template data missing some fields expected from scanner format');
      }
      
      console.log('Template data received:', templateData);
      
      // Store the template data but don't call the callback yet
      // We'll wait for the user to click the button
      setProcessedTemplate(templateData);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing fingerprint image:', err);
      
      // Extract the error message
      let errorMessage = err.message || 'Unknown error';
      
      // Try to extract server error message if it's embedded in the error
      try {
        if (errorMessage.includes('API Error:')) {
          errorMessage = errorMessage.replace('API Error:', '').trim();
        }
        if (errorMessage.includes('Server error:')) {
          const jsonStart = errorMessage.indexOf('{');
          if (jsonStart > -1) {
            const jsonPart = errorMessage.substring(jsonStart);
            const errorObj = JSON.parse(jsonPart);
            if (errorObj.error) {
              errorMessage = errorObj.error;
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        // Keep the original error message if parsing fails
      }
      
      // Provide a more helpful error message based on the error type
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        setError('Network error: Could not connect to the fingerprint processing service. Please check your connection and try again.');
      } else if (errorMessage.includes('JSON')) {
        setError('Error parsing server response: The server may be returning an invalid format. Please contact technical support.');
      } else if (errorMessage.includes('CORS')) {
        setError('CORS error: Browser security is preventing access to the fingerprint service. Please contact technical support.');
      } else if (errorMessage.includes('too many values to unpack')) {
        setError('The fingerprint image format is not compatible with the processing system. Please try a different image or use the fingerprint scanner.');
      } else {
        setError('Failed to process fingerprint image: ' + errorMessage);
      }
      
      setIsProcessing(false);
    }
  };
  
  // Handle button click to generate DID from uploaded image
  const handleGenerateTemplateAndDID = () => {
    if (!processedTemplate) {
      setError('No fingerprint template available. Please upload an image first.');
      return;
    }
    
    // Additional validation to ensure we have the required template data
    if (!processedTemplate.iso_template_base64) {
      console.error('Missing ISO template base64 in processed template:', processedTemplate);
      setError('Invalid fingerprint template: Missing required template data');
      return;
    }
    
    // Validate the template data structure
    try {
      // Check if the ISO template can be decoded
      const templateBytes = atob(processedTemplate.iso_template_base64);
      if (templateBytes.length < 32) {
        throw new Error('Template data is too small to be valid');
      }
      
      // Check for the ISO template header (should start with 'FMR')
      const headerStart = templateBytes.substring(0, 3);
      if (headerStart !== 'FMR') {
        throw new Error(`Invalid template header: ${headerStart}`);
      }
      
      // Validate that fingerprints array exists and has at least one entry
      if (!processedTemplate.fingerprints || processedTemplate.fingerprints.length === 0) {
        throw new Error('Template is missing fingerprint data');
      }
      
      // Check for required fields that should match scanner output
      if (!processedTemplate.finalizedAt || !processedTemplate.userId) {
        throw new Error('Template is missing required metadata fields');
      }
      
      console.log('Template validation passed, proceeding with DID generation');
    } catch (error) {
      console.error('Template validation failed:', error);
      setError(`Invalid template format: ${error.message}. Please try again with a different image.`);
      return;
    }
    
    setIsGenerating(true);
    
    // Short delay to simulate processing
    setTimeout(() => {
      try {
        // Call the parent callback with the template data
        onBiometricCaptured(processedTemplate);
        setIsGenerating(false);
      } catch (error) {
        console.error('Error in onBiometricCaptured callback:', error);
        setError('Error processing template: ' + (error.message || 'Unknown error'));
        setIsGenerating(false);
      }
    }, 500);
  };

  // Handle enrollment completion from the FingerprintEnrollment component
  const handleEnrollmentComplete = (templateData) => {
    // Pass the template data to the parent component
    onBiometricCaptured(templateData);
  };

  return (
    <div className="biometric-input">
      {/* Toggle switch between scan and upload */}
      <div className="input-mode-toggle mb-4">
        <div className="flex justify-center bg-gray-100 rounded-md p-1">
          <button
            className={`px-4 py-2 rounded-md ${
              inputMode === 'scan' 
                ? 'bg-kweli-primary text-white' 
                : 'bg-transparent text-gray-700'
            } transition-all duration-200`}
            onClick={() => {
              setInputMode('scan');
              setProcessedTemplate(null);
              setFingerprintImage(null);
              setError('');
            }}
          >
            Scan Fingerprint
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              inputMode === 'upload' 
                ? 'bg-kweli-primary text-white' 
                : 'bg-transparent text-gray-700'
            } transition-all duration-200`}
            onClick={() => {
              setInputMode('upload');
              setProcessedTemplate(null);
              setFingerprintImage(null);
              setError('');
            }}
          >
            Upload Image
          </button>
        </div>
      </div>

      {/* Display error message if any */}
      {error && (
        <div className="error-message bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Render the appropriate input method based on selected mode */}
      {inputMode === 'scan' ? (
        <div className="fingerprint-scanner">
          <FingerprintEnrollment 
            nationalId={nationalId}
            onEnrollmentComplete={handleEnrollmentComplete}
          />
        </div>
      ) : (
        <div className="file-upload">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/bmp,image/tiff"
              className="hidden"
            />
            
            {fingerprintImage ? (
              <div>
                <div className="w-32 h-32 mx-auto mb-3 border border-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={URL.createObjectURL(fingerprintImage)} 
                    alt="Fingerprint" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-green-600 text-sm mb-2">
                  Fingerprint image selected: {fingerprintImage.name}
                </p>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="text-blue-600 underline text-sm bg-transparent border-none cursor-pointer"
                >
                  Choose a different image
                </button>
                
                {isProcessing && (
                  <div className="mt-4 text-gray-600">
                    <svg className="animate-spin inline-block h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing fingerprint image...
                  </div>
                )}
                
                {processedTemplate && !isProcessing && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className={`py-3 px-4 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                        isGenerating ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      onClick={handleGenerateTemplateAndDID}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin inline-block h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>Save Fingerprint template and generate DID</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current.click()}
                className="cursor-pointer"
              >
                <div className="text-4xl text-gray-400 mb-2">
                  ↑
                </div>
                <p className="text-sm text-gray-600">Click to upload fingerprint image</p>
                <p className="text-xs text-gray-500">JPEG, PNG, BMP or TIFF up to 5MB</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricInput;
