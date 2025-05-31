import React, { useState, useEffect, useRef } from 'react';

/**
 * FingerprintValidation component
 * 
 * This component handles the fingerprint validation process using WebApi:
 * 1. Connects to the fingerprint reader via the SDK client
 * 2. Guides the user to scan their fingerprint once
 * 3. Returns the captured fingerprint to the parent component for verification
 * 
 * @param {Object} props
 * @param {string} props.nationalId - The national ID to verify against
 * @param {Function} props.onCaptureComplete - Callback triggered when capture completes
 */
const FingerprintValidation = ({ nationalId, onCaptureComplete, onError }) => {
  // State variables
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [message, setMessage] = useState('Connect to a fingerprint reader to begin');
  const [error, setError] = useState('');
  const [scanQuality, setScanQuality] = useState(null);
  const [clientConnectionStatus, setClientConnectionStatus] = useState('disconnected');
  
  // Use refs to maintain consistent access across renders
  const sdkRef = useRef(null);
  const bioDataRef = useRef({
    userId: nationalId,
    fingerprints: [],
    createdAt: new Date().toISOString(),
    readerInfo: {},
    formatInfo: {
      name: "ANSI-INCITS 378-2004",
      type: "ISO/IEC 19794-2",
      description: "Finger Minutiae Record Format"
    }
  });

  // Initialize SDK only once when the component mounts
  const initializeSdk = () => {
    try {
      // Only initialize if not already initialized
      if (!window.Fingerprint || !sdkRef.current) {
        // Get client URI from environment variables
        const clientURI = process.env.REACT_APP_FINGERPRINT_CLIENT_URI || "http://172.19.0.1:15895";
        console.log('[FP-DEBUG] Initializing fingerprint reader with client URI:', clientURI);
        // Configure WebApi to use the client for device access
        sdkRef.current = new window.Fingerprint.WebApi({
          useClient: true, // Use the device client
          clientURI: clientURI // Use the configured client URI
        });
        console.log('[FP-DEBUG] WebAPI initialized with client mode using URI:', clientURI);

        // Set up event handlers
        sdkRef.current.onDeviceConnected = (e) => {
          setMessage('Device connected. Scan your finger when ready.');
          setClientConnectionStatus('connected');
          console.log('Device connected:', e);
        };

        sdkRef.current.onDeviceDisconnected = (e) => {
          setMessage('Device disconnected. Please reconnect.');
          setIsScanning(false);
          setClientConnectionStatus('disconnected');
          console.log('Device disconnected:', e);
        };

        sdkRef.current.onCommunicationFailed = (e) => {
          setError('Communication with device failed. Please try again.');
          setIsScanning(false);
          setClientConnectionStatus('failed');
          console.log('Communication failed:', e);
        };

        sdkRef.current.onSamplesAcquired = (s) => {
          handleSampleAcquired(s);
        };

        sdkRef.current.onQualityReported = (e) => {
          setScanQuality(window.Fingerprint.QualityCode[e.quality]);
          console.log('Quality reported:', window.Fingerprint.QualityCode[e.quality]);
        };
      }
      
      // Try to connect to the client
      checkClientConnection();
    } catch (error) {
      setError(`Error initializing WebAPI: ${error.message}`);
      console.error('[FP-DEBUG] Error initializing WebAPI:', error);
      if (onError) onError(error);
    }
  };

  // Check connection to the HID client
  const checkClientConnection = async () => {
    if (!sdkRef.current) {
      setError('SDK not initialized');
      if (onError) onError(new Error('SDK not initialized'));
      return;
    }

    try {
      setIsConnecting(true);
      setMessage('Checking for HID Authentication Lite Client...');
      
      // Try to enumerate devices to check client connection
      const devices = await sdkRef.current.enumerateDevices();
      
      if (devices && devices.length > 0) {
        setReaders(devices);
        setSelectedReader(devices[0].DeviceID); // Select first reader by default
        setMessage('Client connected. Select a fingerprint reader to begin.');
        setClientConnectionStatus('connected');
        console.log('Available readers:', devices);
      } else {
        setMessage('No fingerprint readers found. Please connect a reader.');
        setClientConnectionStatus('disconnected');
      }
    } catch (error) {
      setError(`Failed to connect to HID client: ${error.message}`);
      console.error('[FP-DEBUG] Client connection error:', error);
      if (onError) onError(error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle reader selection change
  const handleReaderChange = (e) => {
    setSelectedReader(e.target.value);
  };

  // Start fingerprint capture
  const startCapture = async () => {
    if (!sdkRef.current || !selectedReader || isScanning) {
      return;
    }

    try {
      setIsScanning(true);
      setMessage('Preparing to capture fingerprint...');
      setScanCount(0);
      bioDataRef.current.fingerprints = [];
      
      // Start acquisition using the selected reader and intermediate format
      await sdkRef.current.startAcquisition(
        window.Fingerprint.SampleFormat.Intermediate,
        selectedReader
      );
      
      setMessage('Scan your finger now...');
    } catch (error) {
      setIsScanning(false);
      setError(`Failed to start capture: ${error.message}`);
      console.error('Failed to start capture:', error);
    }
  };

  // Stop fingerprint capture
  const stopCapture = async () => {
    if (!sdkRef.current || !isScanning) {
      return;
    }

    try {
      await sdkRef.current.stopAcquisition();
      setIsScanning(false);
      setMessage('Fingerprint capture stopped');
    } catch (error) {
      console.error('Error stopping capture:', error);
      setIsScanning(false);
    }
  };

  // Handle acquired fingerprint samples
  const handleSampleAcquired = (s) => {
    if (isScanning) {
      try {
        // Get the samples in Intermediate format (ISO/ANSI compliant)
        const samples = JSON.parse(s.samples);
        if (samples && samples.length > 0) {
          const sampleData = window.Fingerprint.b64UrlTo64(samples[0].Data);
          
          // Increment scan count
          const newCount = scanCount + 1;
          setScanCount(newCount);
          
          // Store the fingerprint in the bioData ref
          bioDataRef.current.fingerprints.push({
            template: sampleData,
            quality: scanQuality || 'Unknown',
            position: 'RIGHT_INDEX', // Default position
            scanIndex: newCount
          });
          
          // For validation, we only need one good scan
          setMessage(`Scan ${newCount} completed successfully!`);
          
          // Stop capture after getting one good sample
          stopCapture();
          
          // Notify the parent component that capture is complete
          if (onCaptureComplete) {
            try {
              onCaptureComplete({
                template: sampleData,
                quality: scanQuality || 'Unknown',
                position: 'RIGHT_INDEX',
                format: 'ISO/IEC 19794-2'
              });
            } catch (callbackError) {
              console.error('Error in capture complete callback:', callbackError);
              setError(`Error in callback: ${callbackError.message}`);
            }
          }
        }
      } catch (error) {
        setError(`Error processing fingerprint: ${error.message}`);
        console.error('Error processing fingerprint:', error);
      }
    }
  };

  // Reconnect to client and readers
  const handleReconnect = () => {
    checkClientConnection();
  };

  useEffect(() => {
    console.log('FingerprintValidation component mounted with ID:', nationalId);
    initializeSdk();
    return () => {
      stopCapture();
    };
  }, [initializeSdk, nationalId, stopCapture]);

  return (
    <div className="fingerprint-validation p-4 bg-white rounded-lg shadow-md mb-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Fingerprint Validation</h3>
        <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
          {message}
        </div>
      </div>

      {/* Client connection status */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            clientConnectionStatus === 'connected' ? 'bg-green-500' :
            clientConnectionStatus === 'disconnected' ? 'bg-gray-400' :
            clientConnectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">
            Client Status: {
              clientConnectionStatus === 'connected' ? 'Connected' :
              clientConnectionStatus === 'no-readers' ? 'No Readers Found' :
              clientConnectionStatus === 'failed' ? 'Connection Failed' : 'Disconnected'
            }
          </span>
        </div>
        <button
          onClick={handleReconnect}
          disabled={isConnecting}
          className={`px-3 py-1 text-sm ${
            isConnecting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } rounded-md transition-colors duration-200`}
        >
          {isConnecting ? 'Connecting...' : 'Reconnect Client'}
        </button>
      </div>

      {/* Reader selection */}
      {readers.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Fingerprint Reader:
          </label>
          <select
            value={selectedReader}
            onChange={handleReaderChange}
            disabled={isScanning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-kweli-primary focus:border-kweli-primary"
          >
            {readers.map((reader) => (
              <option key={reader.DeviceID} value={reader.DeviceID}>
                {reader.DeviceName || reader.DeviceID}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scan quality display */}
      {scanQuality && (
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Last Scan Quality:</label>
            <span className={`text-sm px-2 py-1 rounded-md ${
              scanQuality === 'Good' ? 'bg-green-100 text-green-700' :
              scanQuality === 'Poor' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {scanQuality}
            </span>
          </div>
        </div>
      )}

      {/* Capture controls */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={startCapture}
          disabled={!selectedReader || isScanning}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
            !selectedReader || isScanning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-kweli-primary text-white hover:bg-kweli-secondary'
          } transition-colors duration-200`}
        >
          {isScanning ? 'Scanning...' : 'Start Capture'}
        </button>
        
        <button
          onClick={stopCapture}
          disabled={!isScanning}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
            !isScanning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          } transition-colors duration-200`}
        >
          Stop Capture
        </button>
      </div>

      {/* Scan progress */}
      {scanCount > 0 && (
        <div className="mb-4">
          <div className="bg-green-50 p-3 rounded-md text-green-700">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Fingerprint captured successfully!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintValidation;
