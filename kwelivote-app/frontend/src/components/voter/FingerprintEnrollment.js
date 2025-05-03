import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * FingerprintEnrollment component
 * 
 * This component handles the fingerprint enrollment process:
 * 1. Connects to the fingerprint reader via the HID light client running on the host defined in REACT_APP_FINGERPRINT_CLIENT_URI
 * 2. Guides the user to scan their fingerprint 5 times
 * 3. Generates an ANSI-INCITS 378-2004 fingerprint template
 * 4. Links the template to the user's national ID
 * 
 * @param {Object} props
 * @param {string} props.nationalId - The national ID to link with the biometric data
 * @param {Function} props.onEnrollmentComplete - Callback triggered when enrollment completes
 */
const FingerprintEnrollment = ({ nationalId, onEnrollmentComplete }) => {
  // State variables
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [totalScansNeeded] = useState(5);
  const [fingerprintImage, setFingerprintImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState('Connect to a fingerprint reader to begin');
  const [error, setError] = useState('');
  const [scanQuality, setScanQuality] = useState(null);
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  
  // Refs to maintain state across renders
  const sdk = useRef(null);
  const bioIdentity = useRef({
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

  // Stop fingerprint capture - using useCallback to avoid dependency issues
  const stopCapture = useCallback(async () => {
    if (sdk.current && isScanning) {
      try {
        await sdk.current.stopAcquisition(selectedReader);
      } catch (err) {
        console.error('Error stopping capture:', err);
      }
      setIsScanning(false);
    }
  }, [isScanning, selectedReader]);
  
  // Set up SDK event handlers - using useCallback to avoid dependency issues
  const setupEventHandlers = useCallback(() => {
    if (!sdk.current) return;
    
    // Device connected event
    sdk.current.onDeviceConnected = function (e) {
      setMessage(`Reader connected: ${e.deviceUid.substring(0, 5)}...`);
    };
    
    // Device disconnected event
    sdk.current.onDeviceDisconnected = function (e) {
      setMessage(`Reader disconnected: ${e.deviceUid.substring(0, 5)}...`);
      setSelectedReader('');
    };
    
    // Samples acquired event
    sdk.current.onSamplesAcquired = function (s) {
      processScan(s);
    };
    
    // Quality reported event
    sdk.current.onQualityReported = function (e) {
      const qualityCodes = {
        0: "Good",
        1: "NoImage",
        2: "TooLight",
        3: "TooDark",
        4: "TooNoisy",
        5: "LowContrast",
        6: "NotEnoughFeatures",
        7: "NotCentered",
        8: "NotAFinger",
        9: "TooHigh",
        10: "TooLow",
        11: "TooLeft",
        12: "TooRight",
        13: "TooStrange",
        14: "TooFast",
        15: "TooSkewed",
        16: "TooShort",
        17: "TooSlow",
        18: "ReverseMotion"
      };
      setScanQuality(qualityCodes[e.quality] || "Unknown");
    };
    
    // Error event
    sdk.current.onErrorOccurred = function (e) {
      const errorMessage = `Error: ${e.error}`;
      setError(errorMessage);
      setIsScanning(false);
    };
    
    // Communication failed event
    sdk.current.onCommunicationFailed = function () {
      setError('Communication with the fingerprint reader failed. Please check your connection.');
      setIsScanning(false);
    };
  }, []);
  
  // Initialize SDK when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Fingerprint) {
      // Initialize the SDK with client URI from environment variables
      sdk.current = new window.Fingerprint.WebApi({
        useClient: true,
        clientURI: process.env.REACT_APP_FINGERPRINT_CLIENT_URI || "http://localhost:15896"
      });
      
      // Set up event handlers
      setupEventHandlers();
      
      // Cleanup when component unmounts
      return () => {
        cleanupEventHandlers();
        stopCapture();
      };
    } else {
      setError('Fingerprint SDK not loaded. Please ensure "fingerprint.sdk.min.js" and "websdk.client.bundle.min.js" are included in your page.');
    }
  }, [setupEventHandlers, stopCapture]);
  
  // Clean up event handlers
  const cleanupEventHandlers = () => {
    if (!sdk.current) return;
    
    sdk.current.onDeviceConnected = null;
    sdk.current.onDeviceDisconnected = null;
    sdk.current.onSamplesAcquired = null;
    sdk.current.onQualityReported = null;
    sdk.current.onErrorOccurred = null;
    sdk.current.onCommunicationFailed = null;
  };
  
  // List available readers
  const discoverReaders = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      if (!sdk.current) {
        throw new Error('SDK not initialized');
      }
      
      const devicesResult = await sdk.current.enumerateDevices();
      setReaders(devicesResult);
      
      if (devicesResult.length > 0) {
        setSelectedReader(devicesResult[0]);
        setMessage(`Found ${devicesResult.length} reader(s). Select a reader to continue.`);
        getReaderInfo(devicesResult[0]);
      } else {
        setMessage('No fingerprint readers found. Please connect a reader and try again.');
      }
    } catch (err) {
      setError(`Error discovering readers: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Get reader info
  const getReaderInfo = (readerId) => {
    if (selectedReader && sdk.current) {
      // Get reader info to store with identity
      sdk.current.getDeviceInfo(readerId)
        .then(deviceInfo => {
          const deviceTechn = {
            0: "Unknown",
            1: "Optical",
            2: "Capacitive",
            3: "Thermal",
            4: "Pressure"
          };
          
          const deviceModality = {
            0: "Unknown",
            1: "Swipe",
            2: "Area",
            3: "AreaMultifinger"
          };
          
          const deviceUidType = {
            0: "Persistent",
            1: "Volatile"
          };
          
          bioIdentity.current.readerInfo = {
            deviceId: deviceInfo.DeviceID,
            deviceTech: deviceTechn[deviceInfo.eDeviceTech],
            deviceModality: deviceModality[deviceInfo.eDeviceModality],
            uidType: deviceUidType[deviceInfo.eUidType]
          };
        })
        .catch(err => {
          console.error('Error getting device info:', err);
        });
    }
  };
  
  // Start fingerprint capture
  const startCapture = async () => {
    if (!selectedReader) {
      setError('Please select a reader first');
      return;
    }
    
    setError('');
    
    try {
      // Start capture with PNG format (for display) and Intermediate format (for template)
      await sdk.current.startAcquisition(
        window.Fingerprint.SampleFormat.PngImage | 
        window.Fingerprint.SampleFormat.Intermediate,
        selectedReader
      );
      
      setIsScanning(true);
      setMessage(`Please place your finger on the reader (Scan ${scanCount + 1} of ${totalScansNeeded})`);
    } catch (err) {
      setError(`Failed to start capture: ${err.message}`);
    }
  };
  
  // Process a completed scan
  const processScan = (s) => {
    try {
      const samples = JSON.parse(s.samples);
      
      if (s.sampleFormat === window.Fingerprint.SampleFormat.PngImage) {
        // For display purposes
        setFingerprintImage(`data:image/png;base64,${window.Fingerprint.b64UrlTo64(samples[0])}`);
        setShowPreview(true);
      }
      
      if (s.sampleFormat === window.Fingerprint.SampleFormat.Intermediate) {
        // For ANSI/ISO template
        // Add fingerprint data to the collection
        bioIdentity.current.fingerprints.push({
          format: "ANSI-INCITS 378-2004",
          quality: scanQuality || "Good",
          timestamp: new Date().toISOString(),
          scanIndex: scanCount + 1
        });
        
        // Increment scan count
        setScanCount(prevCount => {
          const newCount = prevCount + 1;
          
          // Check if we need to stop or continue scanning
          if (newCount >= totalScansNeeded) {
            stopCapture();
            setMessage('All scans completed! Click "Save" to complete enrollment.');
            
            // Prepare the fingerprint template
            setFingerprintTemplate(bioIdentity.current);
          } else {
            // Pause briefly between scans
            stopCapture();
            setTimeout(() => {
              setMessage(`Please scan your finger again (${newCount + 1} of ${totalScansNeeded})`);
              startCapture();
            }, 1500);
          }
          
          return newCount;
        });
      }
    } catch (err) {
      setError(`Error processing scan: ${err.message}`);
      setIsScanning(false);
    }
  };
  
  // Complete enrollment
  const completeEnrollment = () => {
    if (scanCount < totalScansNeeded) {
      setError(`Please complete all ${totalScansNeeded} scans before saving`);
      return;
    }
    
    // Create the final template object
    const templateData = {
      nationalId: nationalId,
      ...bioIdentity.current
    };
    
    // Save to JSON file and call parent callback
    if (onEnrollmentComplete) {
      onEnrollmentComplete(templateData);
    }
  };
  
  // Reset enrollment
  const resetEnrollment = () => {
    setScanCount(0);
    setFingerprintTemplate(null);
    setIsScanning(false);
    setShowPreview(false);
    setError('');
    setMessage('Ready to start enrollment');
    
    // Reset identity but keep reader info
    const readerInfo = bioIdentity.current.readerInfo;
    bioIdentity.current = {
      userId: nationalId,
      fingerprints: [],
      createdAt: new Date().toISOString(),
      readerInfo: readerInfo,
      formatInfo: {
        name: "ANSI-INCITS 378-2004",
        type: "ISO/IEC 19794-2",
        description: "Finger Minutiae Record Format"
      }
    };
  };
  
  // Change the selected reader
  const handleReaderChange = (event) => {
    const readerId = event.target.value;
    setSelectedReader(readerId);
    getReaderInfo(readerId);
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900">Fingerprint Enrollment</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex space-x-4">
        <div className="w-1/2">
          {/* Reader selection and controls */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fingerprint Reader
            </label>
            <div className="flex space-x-2">
              <select
                className="form-select block w-full rounded-md border-gray-300 shadow-sm"
                value={selectedReader}
                onChange={handleReaderChange}
                disabled={isConnecting || isScanning}
              >
                <option value="">Select a reader</option>
                {readers.map((reader) => (
                  <option key={reader} value={reader}>
                    {reader.substring(0, 8)}...
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={discoverReaders}
                disabled={isConnecting || isScanning}
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
          
          {/* Scan controls */}
          <div className="mb-4">
            <div className="flex justify-between">
              <button
                type="button"
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                onClick={startCapture}
                disabled={!selectedReader || isScanning || scanCount >= totalScansNeeded}
              >
                {isScanning ? "Scanning..." : "Start Scan"}
              </button>
              
              <button
                type="button"
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                onClick={stopCapture}
                disabled={!isScanning}
              >
                Stop Scan
              </button>
              
              <button
                type="button"
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={resetEnrollment}
                disabled={isScanning}
              >
                Reset
              </button>
            </div>
          </div>
          
          {/* Status message */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
              {message}
            </div>
          </div>
          
          {/* Scan progress */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Progress
            </label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{width: `${(scanCount / totalScansNeeded) * 100}%`}}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {scanCount} of {totalScansNeeded} scans completed
            </p>
          </div>
          
          {scanQuality && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Scan Quality
              </label>
              <div className={`px-3 py-2 rounded-md text-sm ${
                scanQuality === 'Good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {scanQuality}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-1/2">
          {/* Fingerprint preview */}
          <div className="border rounded-md p-4 bg-white h-48 flex items-center justify-center">
            {showPreview && fingerprintImage ? (
              <img 
                src={fingerprintImage} 
                alt="Fingerprint scan" 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l-9-5 9-5 9 5-9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v12" />
                </svg>
                <p>Scan preview will appear here</p>
              </div>
            )}
          </div>
          
          {/* Complete enrollment button */}
          <div className="mt-4">
            <button
              type="button"
              className="w-full px-4 py-2 bg-kweli-primary text-white rounded-md hover:bg-kweli-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary disabled:opacity-50"
              onClick={completeEnrollment}
              disabled={scanCount < totalScansNeeded || isScanning}
            >
              Save Fingerprint Template
            </button>
            
            {fingerprintTemplate && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 text-sm">Fingerprint template ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FingerprintEnrollment;