import React, { useState, useEffect, useRef } from 'react';

/**
 * FingerprintEnrollment component
 * 
 * This component handles the fingerprint enrollment process using WebApi:
 * 1. Connects to the fingerprint reader via the SDK client
 * 2. Guides the user to scan their fingerprint multiple times (default: 5)
 * 3. Generates a fingerprint template
 * 4. Returns the template to the parent component
 * 
 * @param {Object} props
 * @param {string} props.nationalId - The national ID to link with the biometric data
 * @param {Function} props.onEnrollmentComplete - Callback triggered when enrollment completes
 * @param {number} [props.requiredScans=5] - Number of scans required (defaults to 5)
 */
const FingerprintEnrollment = ({ nationalId, onEnrollmentComplete, requiredScans = 5 }) => {
  // State variables
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [totalScansNeeded] = useState(requiredScans);
  const [message, setMessage] = useState('Connect to a fingerprint reader to begin');
  const [error, setError] = useState('');
  const [scanQuality, setScanQuality] = useState(null);
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
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
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Fingerprint) {
      setError('Fingerprint SDK WebApi not available. Please check script loading.');
      return;
    }
    
    // Docker network IP address that has been detected in your logs
    const clientURI = process.env.REACT_APP_FINGERPRINT_CLIENT_URI || "http://172.19.0.1:15896";
    
    try {
      console.log(`Initializing Fingerprint SDK WebApi with client URL: ${clientURI}`);
      
      // Create WebApi instance with client mode enabled
      sdkRef.current = new window.Fingerprint.WebApi({
        useClient: true,
        clientURI: clientURI
      });
      
      // Set up event handlers for WebApi
      setupEventHandlers();
      
      // Store user ID with biometric data
      bioDataRef.current.userId = nationalId;
    } catch (err) {
      console.error("Error initializing fingerprint SDK:", err);
      setError(`Error initializing WebApi: ${err.message}`);
    }
    
    // Cleanup when component unmounts
    return () => {
      if (sdkRef.current) {
        if (isScanning) {
          try {
            sdkRef.current.stopAcquisition(selectedReader);
          } catch (err) {
            console.error("Error stopping acquisition:", err);
          }
        }
        
        // Remove event handlers
        removeEventHandlers();
      }
    };
  }, [nationalId]);

  // Update bioData when nationalId changes
  useEffect(() => {
    if (bioDataRef.current) {
      bioDataRef.current.userId = nationalId;
    }
  }, [nationalId]);

  // Set up event handlers for the WebApi
  const setupEventHandlers = () => {
    if (!sdkRef.current) return;
    
    console.log("Setting up WebApi event handlers");
    
    // Device connected event
    sdkRef.current.onDeviceConnected = (e) => {
      console.log("Device connected:", e);
      setMessage(`Reader connected: ${e.deviceUid}`);
    };
    
    // Device disconnected event
    sdkRef.current.onDeviceDisconnected = (e) => {
      console.log("Device disconnected:", e);
      setMessage(`Reader disconnected: ${e.deviceUid}`);
      setSelectedReader('');
      setIsScanning(false);
    };
    
    // Samples acquired event
    sdkRef.current.onSamplesAcquired = (s) => {
      console.log("Samples acquired event received:", s);
      handleSampleAcquired(s);
    };
    
    // Quality reported event
    sdkRef.current.onQualityReported = (e) => {
      console.log("Quality reported:", e);
      const qualityMap = {
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
      
      const quality = qualityMap[e.quality] || `Unknown (${e.quality})`;
      console.log(`Scan quality: ${quality}`);
      setScanQuality(quality);
    };
    
    // Error occurred event
    sdkRef.current.onErrorOccurred = (e) => {
      const errorMsg = `WebApi error: ${e.error}`;
      console.error(errorMsg);
      setError(errorMsg);
      setIsScanning(false);
    };
    
    // Communication failed event
    sdkRef.current.onCommunicationFailed = () => {
      const errorMsg = "Communication with WebApi client failed";
      console.error(errorMsg);
      setError(errorMsg);
      setIsScanning(false);
      setClientConnectionStatus('disconnected');
    };
  };

  // Remove event handlers
  const removeEventHandlers = () => {
    if (!sdkRef.current) return;
    
    sdkRef.current.onDeviceConnected = null;
    sdkRef.current.onDeviceDisconnected = null;
    sdkRef.current.onSamplesAcquired = null;
    sdkRef.current.onQualityReported = null;
    sdkRef.current.onErrorOccurred = null;
    sdkRef.current.onCommunicationFailed = null;
  };
  
  // Discover available fingerprint readers
  const discoverReaders = async () => {
    setIsConnecting(true);
    setError('');
    setClientConnectionStatus('connecting');
    
    try {
      if (!sdkRef.current) {
        throw new Error("SDK not initialized");
      }
      
      console.log("Discovering fingerprint readers through WebApi...");
      const devices = await sdkRef.current.enumerateDevices();
      console.log("Available readers:", devices);
      
      if (devices && devices.length > 0) {
        setReaders(devices);
        setSelectedReader(devices[0]);
        setClientConnectionStatus('connected');
        setMessage(`Found ${devices.length} reader(s). Ready to scan.`);
        
        // Get reader information for the selected device
        try {
          const deviceInfo = await sdkRef.current.getDeviceInfo(devices[0]);
          console.log("Device info:", deviceInfo);
          
          // Store device information
          bioDataRef.current.readerInfo = {
            deviceId: deviceInfo.DeviceID,
            deviceTech: getDeviceTechName(deviceInfo.eDeviceTech),
            deviceModality: getDeviceModalityName(deviceInfo.eDeviceModality),
            uidType: getDeviceUidTypeName(deviceInfo.eUidType)
          };
        } catch (infoErr) {
          console.warn("Could not get device info:", infoErr);
        }
      } else {
        setReaders([]);
        setMessage("No fingerprint readers detected. Please connect a reader and try again.");
        setClientConnectionStatus('connected'); // Client is connected but no readers found
      }
    } catch (err) {
      console.error("Error discovering readers:", err);
      setError(`Failed to discover readers: ${err.message || err}`);
      setClientConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Utility functions to get readable device info
  const getDeviceTechName = (tech) => {
    const techNames = {
      0: "Unknown",
      1: "Optical",
      2: "Capacitive",
      3: "Thermal",
      4: "Pressure"
    };
    return techNames[tech] || "Unknown";
  };
  
  const getDeviceModalityName = (modality) => {
    const modalityNames = {
      0: "Unknown",
      1: "Swipe",
      2: "Area",
      3: "AreaMultifinger"
    };
    return modalityNames[modality] || "Unknown";
  };
  
  const getDeviceUidTypeName = (uidType) => {
    const uidTypeNames = {
      0: "Persistent",
      1: "Volatile"
    };
    return uidTypeNames[uidType] || "Unknown";
  };
  
  // Start fingerprint acquisition
  const startCapture = async () => {
    if (!selectedReader) {
      setError("Please select a reader first");
      return;
    }
    
    setError('');
    
    try {
      console.log(`Starting acquisition on reader: ${selectedReader}`);
      // Always use Intermediate format for ANSI/ISO templates
      const sampleFormat = window.Fingerprint.SampleFormat.Intermediate;
      await sdkRef.current.startAcquisition(sampleFormat, selectedReader);
      
      setIsScanning(true);
      setMessage(`Please place your finger on the reader (Scan ${scanCount + 1} of ${totalScansNeeded})`);
    } catch (err) {
      console.error("Error starting acquisition:", err);
      setError(`Failed to start scan: ${err.message || err}`);
      setIsScanning(false);
    }
  };
  
  // Stop fingerprint acquisition
  const stopCapture = async () => {
    if (!isScanning) return;
    
    try {
      console.log("Stopping acquisition");
      await sdkRef.current.stopAcquisition(selectedReader);
    } catch (err) {
      console.error("Error stopping acquisition:", err);
    } finally {
      setIsScanning(false);
    }
  };
  
  // Handle acquired fingerprint sample
  const handleSampleAcquired = (sampleData) => {
    try {
      console.log("Processing acquired sample:", sampleData);
      
      let samples;
      try {
        // Parse samples if it's a string
        if (typeof sampleData.samples === 'string') {
          samples = JSON.parse(sampleData.samples);
        } else {
          samples = sampleData.samples;
        }
        console.log("Parsed samples:", samples);
      } catch (parseErr) {
        console.error("Error parsing sample data:", parseErr);
        setError("Invalid sample data received from reader");
        return;
      }
      
      // Extract sample based on format
      let extractedSample = null;
      
      if (sampleData.sampleFormat === window.Fingerprint.SampleFormat.Intermediate) {
        console.log("Processing Intermediate format sample");
        
        if (Array.isArray(samples)) {
          if (samples[0] && samples[0].Data) {
            extractedSample = window.Fingerprint.b64UrlTo64(samples[0].Data);
            console.log("Extracted sample from Data property");
          } else if (typeof samples[0] === 'string') {
            extractedSample = window.Fingerprint.b64UrlTo64(samples[0]);
            console.log("Extracted sample from string");
          }
        }
      } else if (sampleData.sampleFormat === window.Fingerprint.SampleFormat.Raw) {
        console.log("Processing Raw format sample");
        
        if (Array.isArray(samples) && samples[0] && samples[0].Data) {
          const rawData = window.Fingerprint.b64UrlTo64(samples[0].Data);
          try {
            const decodedData = JSON.parse(window.Fingerprint.b64UrlToUtf8(rawData));
            if (decodedData.Data) {
              extractedSample = window.Fingerprint.b64UrlTo64(decodedData.Data);
              console.log("Extracted sample from decoded raw data");
            }
          } catch (decodeErr) {
            console.error("Error decoding raw data:", decodeErr);
          }
        }
      }
      
      if (!extractedSample) {
        console.error("Failed to extract sample data");
        setError("Could not extract fingerprint data");
        return;
      }
      
      // Add the fingerprint data to our collection
      bioDataRef.current.fingerprints.push({
        format: "ANSI-INCITS 378-2004",
        quality: scanQuality || "Good",
        timestamp: new Date().toISOString(),
        scanIndex: scanCount + 1,
        sample: extractedSample
      });
      
      console.log(`Successfully added scan ${scanCount + 1}`);
      
      // Stop the current scan
      stopCapture();
      
      // Update scan count
      const newCount = scanCount + 1;
      setScanCount(newCount);
      
      // Check if we've completed all scans
      if (newCount >= totalScansNeeded) {
        setMessage("All scans completed! Processing template...");
        finalizeFingerprintTemplate();
      } else {
        // Delay before starting next scan
        setMessage(`Scan successful! Please prepare for scan ${newCount + 1} of ${totalScansNeeded}`);
        
        setTimeout(() => {
          if (newCount < totalScansNeeded) {
            setMessage(`Please place your finger on the reader (Scan ${newCount + 1} of ${totalScansNeeded})`);
            startCapture();
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Error processing sample:", err);
      setError(`Error processing scan: ${err.message}`);
      setIsScanning(false);
    }
  };
  
  // Reset the enrollment process
  const resetEnrollment = () => {
    stopCapture();
    
    setScanCount(0);
    setFingerprintTemplate(null);
    setError('');
    setMessage('Ready to start enrollment');
    
    // Keep reader info but reset fingerprints
    const readerInfo = bioDataRef.current.readerInfo;
    bioDataRef.current = {
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
  
  // Finalize the template when all scans are completed
  const finalizeFingerprintTemplate = () => {
    try {
      console.log("Finalizing template with fingerprints:", bioDataRef.current.fingerprints.length);
      
      // Create the final template
      const template = {
        ...bioDataRef.current,
        finalizedAt: new Date().toISOString()
      };
      
      // Update state
      setFingerprintTemplate(template);
      
      // Call the callback if provided
      if (onEnrollmentComplete) {
        onEnrollmentComplete(template);
      }
      
      setMessage("Template created successfully!");
    } catch (err) {
      console.error("Error finalizing template:", err);
      setError(`Failed to create template: ${err.message}`);
    }
  };
  
  // Handle reader selection change
  const handleReaderChange = (e) => {
    setSelectedReader(e.target.value);
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = (scanCount / totalScansNeeded) * 100;
  
  return (
    <div className="space-y-4 border rounded-lg bg-gray-50 p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Reader connection */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Fingerprint Reader
          </label>
          <span className={`text-xs px-2 py-1 rounded-full ${
            clientConnectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
            clientConnectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {clientConnectionStatus === 'connected' ? 'Connected' : 
             clientConnectionStatus === 'connecting' ? 'Connecting...' : 
             'Disconnected'}
          </span>
        </div>
        
        <div className="flex space-x-2 mb-2">
          <select
            className="form-select block w-full rounded-md border-gray-300 shadow-sm text-sm"
            value={selectedReader}
            onChange={handleReaderChange}
            disabled={isConnecting || isScanning || readers.length === 0}
          >
            <option value="">Select a reader</option>
            {readers.map((reader) => (
              <option key={reader} value={reader}>
                {reader.substring(0, 15)}...
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`px-3 py-1 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isConnecting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={discoverReaders}
            disabled={isConnecting || isScanning}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
      
      {/* Status message */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
        {message}
      </div>
      
      {/* Scan controls */}
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          className={`flex-1 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            !selectedReader || isScanning || scanCount >= totalScansNeeded 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          }`}
          onClick={startCapture}
          disabled={!selectedReader || isScanning || scanCount >= totalScansNeeded}
        >
          {isScanning ? "Scanning..." : "Start Scan"}
        </button>
        
        <button
          type="button"
          className={`py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            !isScanning 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
          }`}
          onClick={stopCapture}
          disabled={!isScanning}
        >
          Stop
        </button>
        
        <button
          type="button"
          className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={resetEnrollment}
          disabled={isScanning}
        >
          Reset
        </button>
      </div>
      
      {/* Scan progress */}
      <div>
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="text-gray-700 font-medium">Scan Progress</span>
          <span className="text-gray-500">{scanCount} of {totalScansNeeded}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{width: `${progressPercentage}%`}}
          ></div>
        </div>
        
        {/* Scan indicators */}
        <div className="flex justify-between mt-2">
          {Array.from({ length: totalScansNeeded }, (_, index) => (
            <div 
              key={index}
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                scanCount > index 
                  ? 'bg-green-500 text-white' 
                  : scanCount === index && isScanning 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {scanCount > index ? (
                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </div>
      
      {scanQuality && (
        <div className="mt-2">
          <span className="block text-xs font-medium text-gray-700">
            Last Scan Quality: 
            <span className={`ml-1 ${
              scanQuality === 'Good' ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {scanQuality}
            </span>
          </span>
        </div>
      )}
      
      {fingerprintTemplate && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm font-medium">All scans complete! Fingerprint template ready.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintEnrollment;