import React, { useState, useEffect } from 'react';
import FingerprintEnrollment from './FingerprintEnrollment';

const VoterStep2 = ({ formData, handleFileChange, prevStep, handleSubmit, isSubmitting = false, onEnrollmentComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [useFingerPrintReader, setUseFingerPrintReader] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [isDetectingFingerprint, setIsDetectingFingerprint] = useState(false);
  
  const handlePrev = (e) => {
    e.preventDefault();
    prevStep();
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Add fingerprint template to form data if available
    if (fingerprintTemplate) {
      // In a real implementation, you'd want to properly add this to your form data
      console.log('Submitting with fingerprint template:', fingerprintTemplate);
    }
    handleSubmit(e);
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleEnrollmentComplete = (templateData) => {
    setFingerprintTemplate(templateData);
    // Pass the data up to the parent component
    if (onEnrollmentComplete) {
      onEnrollmentComplete(templateData);
    }
  };
  
  // Custom file change handler that includes fingerprint detection
  const handleFileChangeWithDetection = async (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      // Call original handler to update form data
      handleFileChange(e);
      
      // If this is a biometric image, detect if it's a fingerprint
      if (name === 'biometricImage') {
        await detectFingerprint(files[0]);
      }
    }
  };
  
  // Function to detect if the uploaded image is a fingerprint
  const detectFingerprint = async (file) => {
    // Only process image files
    if (!file.type.startsWith('image/')) {
      return;
    }
    
    setIsDetectingFingerprint(true);
    
    try {
      // Read the file as data URL
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const image = new Image();
        image.onload = () => {
          // Use a simple heuristic approach to detect fingerprints:
          // 1. Check image aspect ratio (fingerprints are typically square-ish)
          // 2. Analyze pixel intensity distribution (fingerprints have specific patterns)
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          const data = imageData.data;
          
          // Calculate aspect ratio - fingerprints are usually close to square
          const aspectRatio = image.width / image.height;
          const isSquarish = aspectRatio >= 0.7 && aspectRatio <= 1.4;
          
          // Check for ridge-like patterns (simplified heuristic)
          // Count transitions between light and dark pixels
          let ridgePatterns = 0;
          const threshold = 90; // Threshold for light vs dark
          
          // Sample every 10th pixel in rows and columns for performance
          for (let y = 0; y < image.height; y += 10) {
            let lastWasLight = false;
            for (let x = 0; x < image.width; x += 10) {
              const idx = (y * image.width + x) * 4;
              // Convert to grayscale intensity
              const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
              const isLight = gray > threshold;
              
              if (isLight !== lastWasLight) {
                ridgePatterns++;
                lastWasLight = isLight;
              }
            }
          }
          
          // Check for sufficient ridge transitions
          // Fingerprints typically have many transitions due to ridge patterns
          const hasRidgePatterns = ridgePatterns > (image.width + image.height) / 8;
          
          // If it looks like a fingerprint
          if (isSquarish && hasRidgePatterns) {
            console.log('Fingerprint detected!');
            
            // Generate a template based on the uploaded fingerprint
            generateFingerprintTemplate(file);
          } else {
            console.log('Not a fingerprint or low-quality fingerprint');
            setIsDetectingFingerprint(false);
          }
        };
        
        image.src = event.target.result;
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error detecting fingerprint:', error);
      setIsDetectingFingerprint(false);
    }
  };
  
  // Generate fingerprint template from an uploaded fingerprint image
  const generateFingerprintTemplate = (file) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        // Create template structure similar to what the fingerprint reader produces
        const template = {
          userId: formData.nationalid || 'unknown',
          fingerprints: [{
            format: "ANSI-INCITS 378-2004",
            quality: "Medium", // Default quality for uploaded images
            timestamp: new Date().toISOString(),
            scanIndex: 1,
            // Store base64 representation of the image
            sample: event.target.result.split(',')[1] // Remove data:image part
          }],
          createdAt: new Date().toISOString(),
          source: "uploaded", // Indicate this was an uploaded file, not a live scan
          formatInfo: {
            name: "ANSI-INCITS 378-2004",
            type: "ISO/IEC 19794-2",
            description: "Finger Minutiae Record Format"
          }
        };
        
        // Set the template and notify parent component
        setFingerprintTemplate(template);
        if (onEnrollmentComplete) {
          onEnrollmentComplete(template);
        }
        
        setIsDetectingFingerprint(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error generating fingerprint template:', error);
      setIsDetectingFingerprint(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="p-5 bg-gradient-to-r from-gray-50 to-kweli-light border border-gray-100 rounded-lg shadow-soft-sm">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
            <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-kweli-dark">Biometric Data Collection</h3>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          Biometric data is optional and can be left blank. You can either use the fingerprint reader or upload existing biometric data files.
        </p>
        
        {/* Biometric collection method toggle */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setUseFingerPrintReader(false)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-center ${!useFingerPrintReader 
                ? 'border-kweli-primary bg-kweli-primary/5 text-kweli-primary' 
                : 'border-gray-200 bg-white text-gray-500'}`}
            >
              Upload Files
            </button>
            <button
              type="button"
              onClick={() => setUseFingerPrintReader(true)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-center ${useFingerPrintReader 
                ? 'border-kweli-primary bg-kweli-primary/5 text-kweli-primary' 
                : 'border-gray-200 bg-white text-gray-500'}`}
            >
              Use Fingerprint Reader
            </button>
          </div>
        </div>
        
        {/* Show either fingerprint reader or file upload based on toggle */}
        {useFingerPrintReader ? (
          <FingerprintEnrollment 
            nationalId={formData.nationalid} 
            onEnrollmentComplete={handleEnrollmentComplete}
          />
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="biometricImage" className="block text-sm font-medium text-gray-700">
                Fingerprint Image (optional)
              </label>
              <div 
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-kweli-primary bg-kweli-primary/5' : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
              >
                <div className="flex flex-col items-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2 text-sm text-gray-600">
                    <label htmlFor="biometricImage" className="cursor-pointer text-kweli-primary hover:text-kweli-secondary transition-colors">
                      <span>Click to upload</span>
                      <input
                        type="file"
                        id="biometricImage"
                        name="biometricImage"
                        onChange={handleFileChangeWithDetection}
                        accept="image/*"
                        className="sr-only"
                      />
                    </label>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
                
                {isDetectingFingerprint && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md shadow-soft-sm border border-blue-100">
                    <div className="flex items-center">
                      <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium text-blue-700">Analyzing fingerprint...</span>
                    </div>
                  </div>
                )}
                
                {formData.biometricImage && !isDetectingFingerprint && (
                  <div className="mt-4 p-3 bg-white rounded-md shadow-soft-sm border border-gray-100">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{formData.biometricImage.name}</span>
                      {fingerprintTemplate && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Fingerprint Detected
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="biometricData" className="block text-sm font-medium text-gray-700">
                Other Biometric Data File (optional)
              </label>
              <div 
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? 'border-kweli-primary bg-kweli-primary/5' : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
              >
                <div className="flex flex-col items-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2 text-sm text-gray-600">
                    <label htmlFor="biometricData" className="cursor-pointer text-kweli-primary hover:text-kweli-secondary transition-colors">
                      <span>Click to upload</span>
                      <input
                        type="file"
                        id="biometricData"
                        name="biometricData"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Any supported biometric file format
                  </p>
                </div>
                
                {formData.biometricData && (
                  <div className="mt-4 p-3 bg-white rounded-md shadow-soft-sm border border-gray-100">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{formData.biometricData.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-5 flex justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isSubmitting}
          className="flex items-center text-gray-700 font-medium py-2.5 px-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        
        <button
          type="button"
          onClick={handleFormSubmit}
          disabled={isSubmitting}
          className={`flex items-center bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2.5 px-6 rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-300 transform hover:-translate-y-0.5 ${isSubmitting ? 'opacity-80' : ''}`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              Submit
              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoterStep2;