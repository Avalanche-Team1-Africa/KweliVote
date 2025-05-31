import React, { useState, useEffect, useRef } from 'react';

const FingerprintReader = ({ onCapture, onError }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [quality, setQuality] = useState('');
  const [message, setMessage] = useState('');
  const [scanCount, setScanCount] = useState(0);
  
  const sdkRef = useRef(null);
  
  // Format for biometric data - Using ISO/ANSI compliant format
  const currentFormat = window.Fingerprint ? window.Fingerprint.SampleFormat.Intermediate : null;

  // Initialize the WebSDK with client mode
  const initializeWebSDK = () => {
    if (!window.Fingerprint) {
      setMessage('Fingerprint SDK not loaded. Please ensure the WebSDK scripts are properly included.');
      if (onError) onError('Fingerprint SDK not loaded');
      return;
    }
    
    try {
      // Get client URI from environment variables
      const clientURI = process.env.REACT_APP_FINGERPRINT_CLIENT_URI || "http://172.19.0.1:15895";
      console.log('[FP-DEBUG] Initializing fingerprint reader with client URI:', clientURI);
      
      // Create WebSDK instance using client mode
      sdkRef.current = new window.Fingerprint.WebApi({
        useClient: true,
        clientURI: clientURI // Use the configured client URI
      });
      
      console.log('[FP-DEBUG] WebAPI initialized with client mode using URI:', clientURI);
      
      // Set up event handlers
      sdkRef.current.onDeviceConnected = (e) => {
        setMessage('Device connected. Scan your finger.');
      };
      
      sdkRef.current.onDeviceDisconnected = (e) => {
        setMessage('Device disconnected.');
        setIsCapturing(false);
      };
      
      sdkRef.current.onCommunicationFailed = (e) => {
        setMessage('Communication with device failed.');
        setIsCapturing(false);
        if (onError) onError('Communication with fingerprint reader failed');
      };
      
      sdkRef.current.onSamplesAcquired = (s) => {
        handleSampleAcquired(s);
      };
      
      sdkRef.current.onQualityReported = (e) => {
        if (window.Fingerprint.QualityCode) {
          setQuality(window.Fingerprint.QualityCode[e.quality]);
        }
      };
      
      // Initialize succeeded, now enumerate devices
      enumerateReaders();
      setIsInitialized(true);
    } catch (error) {
      setMessage(`[FP-DEBUG] Failed to initialize WebSDK: ${error.message}`);
      if (onError) onError(`[FP-DEBUG] Failed to initialize fingerprint reader: ${error.message}`);
    }
  };
  
  useEffect(() => {
    // Initialize the WebSDK when the component mounts
    initializeWebSDK();
    // Cleanup function to stop capture when component unmounts
    return () => {
      if (sdkRef.current && sdkRef.current.acquisitionStarted) {
        sdkRef.current.stopCapture();
      }
    };
  }, [initializeWebSDK]);

  // Enumerate available fingerprint readers
  const enumerateReaders = () => {
    if (!sdkRef.current) return;
    
    setMessage('Checking for connected fingerprint readers...');
    
    sdkRef.current.enumerateDevices()
      .then(successObj => {
        if (successObj && successObj.length > 0) {
          setReaders(successObj);
          setSelectedReader(successObj[0].DeviceID); // Select first reader by default
          setMessage('Fingerprint reader detected. Ready to capture.');
        } else {
          setMessage('No fingerprint readers detected. Please connect a reader.');
          if (onError) onError('No fingerprint readers detected');
        }
      })
      .catch(error => {
        setMessage(`Failed to enumerate devices: ${error.message}`);
        if (onError) onError(`Failed to detect fingerprint readers: ${error.message}`);
      });
  };
  
  // Start capturing fingerprints
  const startCapture = () => {
    if (!sdkRef.current || !selectedReader || isCapturing) return;
    
    setMessage('');
    setScanCount(0);
    
    sdkRef.current.startAcquisition(currentFormat, selectedReader)
      .then(() => {
        setIsCapturing(true);
        setMessage('Capturing started. Please place your finger on the reader.');
      })
      .catch(error => {
        setMessage(`Failed to start capture: ${error.message}`);
        if (onError) onError(`Failed to start fingerprint capture: ${error.message}`);
      });
  };
  
  // Stop capturing fingerprints
  const stopCapture = () => {
    if (!sdkRef.current || !isCapturing) return;
    
    sdkRef.current.stopAcquisition()
      .then(() => {
        setIsCapturing(false);
        setMessage('Capture stopped.');
      })
      .catch(error => {
        setMessage(`Failed to stop capture: ${error.message}`);
      });
  };
  
  // Handle acquired fingerprint samples
  const handleSampleAcquired = (s) => {
    try {
      if (currentFormat === window.Fingerprint.SampleFormat.Intermediate) {
        // Get the intermediate sample data (ISO/ANSI format)
        const samples = JSON.parse(s.samples);
        const sampleData = window.Fingerprint.b64UrlTo64(samples[0].Data);
        
        // Convert sample to base64 format for storage/transmission
        if (onCapture) {
          const newScanCount = scanCount + 1;
          setScanCount(newScanCount);
          
          // Prepare the data with quality information
          const fingerprintData = {
            template: sampleData,
            quality: quality,
            format: 'ISO/IEC 19794-2',
            scanIndex: newScanCount
          };
          
          onCapture(fingerprintData);
          setMessage(`Scan ${newScanCount} completed successfully.`);
        }
      }
    } catch (error) {
      setMessage(`Error processing fingerprint: ${error.message}`);
      if (onError) onError(`Error processing fingerprint: ${error.message}`);
    }
  };
  
  // Handle reader selection change
  const handleReaderChange = (e) => {
    setSelectedReader(e.target.value);
  };

  return (
    <div className="fingerprint-reader">
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 mb-2">Fingerprint Reader</h4>
        {message && (
          <div className={`p-3 rounded-md mb-2 ${message.includes('Error') || message.includes('failed') ? 
            'bg-red-50 text-red-700' : message.includes('success') ? 
            'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            {message}
          </div>
        )}
        
        {readers.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Reader:
            </label>
            <select
              value={selectedReader}
              onChange={handleReaderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-kweli-primary focus:border-kweli-primary"
              disabled={isCapturing}
            >
              {readers.map((reader) => (
                <option key={reader.DeviceID} value={reader.DeviceID}>
                  {reader.DeviceName || reader.DeviceID}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {quality && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Quality:
            </label>
            <input
              type="text"
              readOnly
              value={quality}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
            />
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={startCapture}
            disabled={!isInitialized || !selectedReader || isCapturing}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !isInitialized || !selectedReader || isCapturing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-kweli-primary hover:bg-kweli-secondary'
            }`}
          >
            Start Capture
          </button>
          
          <button
            onClick={stopCapture}
            disabled={!isCapturing}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !isCapturing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Stop Capture
          </button>
        </div>
      </div>
      
      {scanCount > 0 && (
        <div className="px-3 py-2 bg-green-50 text-green-700 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Fingerprint captured successfully ({scanCount} scan{scanCount !== 1 ? 's' : ''})</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintReader;
