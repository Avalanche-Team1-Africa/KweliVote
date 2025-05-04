import React, { useState } from 'react';
import processFingerprintTemplate from '../../utils/FingerprintTemplateProcessor';

/**
 * Test component for ISO fingerprint template conversion
 */
const FingerprintTemplateTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  
  // Sample JSON structure for reference
  const sampleJson = {
    fingerprints: [
      { finger: "Right Thumb", sample: "base64-encoded-image" },
      { finger: "Right Index", sample: "base64-encoded-image" }
    ]
  };
  
  // Function to handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };
  
  // Function to process the selected JSON file
  const handleProcessFile = async () => {
    if (!file) {
      setError('Please select a JSON file first');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Read file as text
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          // Parse the JSON
          const jsonData = JSON.parse(e.target.result);
          
          // Check if the format is correct
          if (!jsonData.fingerprints || !Array.isArray(jsonData.fingerprints)) {
            throw new Error('Invalid JSON format. Must contain a "fingerprints" array property.');
          }
          
          // Ensure fingerprints array is not empty
          if (jsonData.fingerprints.length === 0) {
            throw new Error('The fingerprints array cannot be empty. Please add at least one fingerprint sample.');
          }
          
          // Validate each fingerprint has the required fields
          for (let i = 0; i < jsonData.fingerprints.length; i++) {
            const fp = jsonData.fingerprints[i];
            if (!fp.finger) {
              throw new Error(`Fingerprint at position ${i} is missing the "finger" field.`);
            }
            if (!fp.sample) {
              throw new Error(`Fingerprint at position ${i} is missing the "sample" field.`);
            }
          }
          
          // Use our new authenticated API function
          const responseData = await processFingerprintTemplate(jsonData);
          setResponse(responseData);
          
        } catch (err) {
          // Check for specific API errors
          if (err.response && err.response.data) {
            if (err.response.data.fingerprints) {
              // This matches the error format we're seeing
              setError(`Fingerprints field error: ${err.response.data.fingerprints.join(', ')}`);
            } else {
              setError(JSON.stringify(err.response.data));
            }
          } else {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fileReader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      
      fileReader.readAsText(file);
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  // Function to download the ISO template
  const handleDownloadTemplate = () => {
    if (!response || !response.iso_template_base64) {
      return;
    }
    
    // Convert base64 to Blob
    const binaryString = window.atob(response.iso_template_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fingerprint_template_${response.id}.iso`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-soft-md border border-gray-100 p-6 mb-8">
      <h2 className="text-lg font-semibold text-kweli-dark mb-4">ISO Fingerprint Template Testing</h2>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Upload a JSON file with base64-encoded fingerprint images:</h3>
        <div className="flex flex-col space-y-2">
          <input 
            type="file" 
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-kweli-light file:text-kweli-primary
              hover:file:bg-kweli-light/80"
          />
          <button 
            onClick={handleProcessFile}
            disabled={isLoading || !file}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors
              ${isLoading || !file ? 'bg-gray-400 cursor-not-allowed' : 
              'bg-gradient-to-r from-kweli-accent to-kweli-primary hover:opacity-90'}`}
          >
            {isLoading ? 'Processing...' : 'Process Fingerprints'}
          </button>
        </div>
      </div>
      
      {/* Sample JSON Format */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Sample JSON format:</h3>
        <pre className="text-xs overflow-x-auto text-gray-700">
          {JSON.stringify(sampleJson, null, 2)}
        </pre>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Error: {error}</p>
        </div>
      )}
      
      {/* Success response */}
      {response && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Process Result:</h3>
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium">Status: {response.processing_status}</p>
            <p className="text-sm">Template ID: {response.id}</p>
          </div>
          
          <button 
            onClick={handleDownloadTemplate}
            className="px-4 py-2 rounded-lg bg-kweli-secondary text-white text-sm font-medium hover:bg-kweli-secondary/90 transition-colors"
          >
            Download ISO Template
          </button>
        </div>
      )}
    </div>
  );
};

export default FingerprintTemplateTest;