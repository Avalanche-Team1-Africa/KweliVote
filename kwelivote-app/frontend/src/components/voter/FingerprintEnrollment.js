import React, { useState, useEffect, useRef } from 'react';
import apiServices from '../../utils/api';
import processFingerprintTemplate from '../../utils/FingerprintTemplateProcessor';

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
 * @param {number} [props.requiredScans=5] - Number of scans required (always 5)
 */
const FingerprintEnrollment = ({ nationalId, onEnrollmentComplete }) => {
  // State variables
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [totalScansNeeded] = useState(5); // Always fixed at 5 scans
  const [message, setMessage] = useState('Connect to a fingerprint reader to begin');
  const [error, setError] = useState('');
  const [scanQuality, setScanQuality] = useState(null);
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [clientConnectionStatus, setClientConnectionStatus] = useState('disconnected');
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    console.log('FingerprintEnrollment component mounted with ID:', nationalId);
    
    if (typeof window === 'undefined' || !window.Fingerprint) {
      setError('Fingerprint SDK WebApi not available. Please check script loading.');
      return;
    }
    
    // Docker network IP address that works for your environment
    const clientURI = process.env.REACT_APP_FINGERPRINT_CLIENT_URI || "http://172.19.0.1:15896";
    
    try {
      console.log(`Initializing Fingerprint SDK WebApi with client URL: ${clientURI}`);
      
      // First, attempt to disconnect any lingering connections by creating and disposing a temporary instance
      if (window.Fingerprint && window.tempSdkCleanup) {
        try {
          console.log('Removing any lingering connections before initializing new one');
          window.tempSdkCleanup();
          window.tempSdkCleanup = null;
        } catch (cleanupErr) {
          console.warn('Error during connection cleanup:', cleanupErr);
        }
      }
      
      // Create WebApi instance with client mode enabled
      sdkRef.current = new window.Fingerprint.WebApi({
        useClient: true,
        clientURI: clientURI
      });
      
      // Store a cleanup function globally so it can be called before next initialization
      window.tempSdkCleanup = () => {
        if (sdkRef.current) {
          try {
            removeEventHandlers();
            if (sdkRef.current.stopAcquisition) {
              sdkRef.current.stopAcquisition();
            }
          } catch (err) {
            console.error("Error during global cleanup:", err);
          }
          sdkRef.current = null;
        }
      };
      
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
      console.log('FingerprintEnrollment component unmounting, cleaning up connections');
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
        sdkRef.current = null;
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
    
    // Critical - Samples acquired event
    sdkRef.current.onSamplesAcquired = (s) => {
      console.log("Samples acquired event received!", s);
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
      console.error("WebApi error:", e);
      setError(`WebApi error: ${e.error || JSON.stringify(e)}`);
      setIsScanning(false);
    };
    
    // Communication failed event
    sdkRef.current.onCommunicationFailed = (e) => {
      console.error("Communication with WebApi client failed:", e);
      setError("Communication with fingerprint reader failed");
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
      
      console.log("Discovering fingerprint readers...");
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
          if (deviceInfo) {
            bioDataRef.current.readerInfo = {
              deviceId: deviceInfo.DeviceID || "unknown",
              deviceTech: getDeviceTechName(deviceInfo.eDeviceTech),
              deviceModality: getDeviceModalityName(deviceInfo.eDeviceModality),
              uidType: getDeviceUidTypeName(deviceInfo.eUidType)
            };
          }
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
      
      // Check if the global Fingerprint object is available
      if (!window.Fingerprint) {
        console.error("Fingerprint SDK not available when starting capture");
        setError("Fingerprint SDK not available");
        return;
      }
      
      // Using PngImage format which works better with most readers
      const sampleFormat = window.Fingerprint.SampleFormat.PngImage;
      console.log("Using sample format:", sampleFormat);
      
      // Make absolutely sure the event handlers are set up
      setupEventHandlers();
      
      // Start acquisition with selected format
      await sdkRef.current.startAcquisition(sampleFormat, selectedReader);
      console.log("Acquisition started successfully");
      
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
  
  // Handle acquired fingerprint sample - CRITICAL FUNCTION
  const handleSampleAcquired = (sampleData) => {
    try {
      console.log("💯 FINGERPRINT SCAN RECEIVED!", sampleData);
      
      // First check if we already have 5 scans - if so, ignore this scan
      if (scanCount >= totalScansNeeded) {
        console.log(`Ignoring scan - already have ${scanCount} of ${totalScansNeeded} scans`);
        stopCapture();
        return;
      }
      
      // Extract sample data from the response
      let extractedSample;
      let samples;
      
      try {
        // Validate that sampleData and samples exist
        if (!sampleData) {
          throw new Error("No sample data received");
        }
        
        // Handle potentially empty samples
        if (sampleData.samples === "" || sampleData.samples === null || sampleData.samples === undefined) {
          console.warn("Empty samples data received, using default placeholder");
          samples = [];  // Set a default empty array to prevent parsing errors
        } 
        // Parse samples if it's a string
        else if (typeof sampleData.samples === 'string') {
          // Ensure the string is not empty before parsing
          if (sampleData.samples.trim() === "") {
            samples = [];
          } else {
            try {
              samples = JSON.parse(sampleData.samples);
            } catch (jsonError) {
              console.error("JSON parse error:", jsonError);
              // If parsing fails, use a safe default
              samples = [];
            }
          }
        } else {
          samples = sampleData.samples;
        }
        
        console.log("Parsed samples:", samples);
        
        // Ensure samples is an array before proceeding
        if (!Array.isArray(samples)) {
          console.warn("Samples is not an array, converting to array format");
          samples = samples ? [samples] : [];
        }
        
        // Handle PngImage format (most reliable with many readers)
        if (sampleData.sampleFormat === window.Fingerprint.SampleFormat.PngImage && samples.length > 0) {
          try {
            extractedSample = window.Fingerprint.b64UrlTo64(samples[0]);
          } catch (conversionErr) {
            console.error("Error converting sample:", conversionErr);
            extractedSample = JSON.stringify(samples);
          }
        } else {
          // Fallback to raw data
          extractedSample = JSON.stringify(samples);
        }
      } catch (parseErr) {
        console.error("Error parsing sample data:", parseErr);
        // Use a safe fallback that won't cause further errors
        extractedSample = JSON.stringify({ error: "Failed to parse samples", message: parseErr.message });
      }
      
      // Calculate the correct scan index based on the current length of the fingerprints array
      const currentScanIndex = bioDataRef.current.fingerprints.length + 1;
      
      // Add the fingerprint sample to our collection
      bioDataRef.current.fingerprints.push({
        format: "PNG-IMAGE",
        quality: scanQuality || "Good",
        timestamp: new Date().toISOString(),
        scanIndex: currentScanIndex, // Use the calculated index which will always be correct
        sample: extractedSample
      });
      
      console.log(`✅ Successfully added scan ${currentScanIndex}`);
      
      // Stop the current scan
      stopCapture();
      
      // Important: Update scan count state - strictly enforce the limit
      // Use a function updater form to ensure we're working with the latest state
      setScanCount(prevCount => {
        const newCount = Math.min(prevCount + 1, totalScansNeeded);
        console.log(`Updated scan count: ${newCount}`);
        
        // Move this logic inside the state updater to ensure it runs with the correct count
        // Check if we've completed all scans
        if (newCount >= totalScansNeeded) {
          // When we reach 5 scans, don't finalize template automatically
          // Instead, show the generate button and make sure we stop scanning
          console.log("✓ All scans completed, enabling generate button...");
          setMessage("All 5 scans completed! Click 'Save Fingerprint template and generate DID' button below.");
          setShowGenerateButton(true);
          stopCapture();
        } else {
          // Show success message
          setMessage(`Scan ${newCount} successful! Please prepare for next scan.`);
          
          // Start next scan after a short delay
          setTimeout(() => {
            if (newCount < totalScansNeeded) {
              setMessage(`Please place your finger on the reader (Scan ${newCount + 1} of ${totalScansNeeded})`);
              startCapture();
            }
          }, 1500);
        }
        
        return newCount;
      });
    } catch (err) {
      console.error("Error processing sample:", err);
      setError(`Error processing scan: ${err.message}`);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // When scan count reaches the limit, ensure the generate button is shown
    if (scanCount >= totalScansNeeded) {
      setShowGenerateButton(true);
    }
  }, [scanCount, totalScansNeeded]);

  // Add a debug display for development that will help diagnose state update issues
  useEffect(() => {
    console.log(`⚛️ React state updated - scanCount: ${scanCount}, isScanning: ${isScanning}, showGenerateButton: ${showGenerateButton}`);
  }, [scanCount, isScanning, showGenerateButton]);
  
  // Reset the enrollment process
  const resetEnrollment = async () => {
    // First stop any ongoing scanning
    await stopCapture();
    
    // Reset all state variables
    setScanCount(0);
    setFingerprintTemplate(null);
    setShowGenerateButton(false);
    setError('');
    setMessage('Reinitializing connection...');
    
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
    
    // Important: Reinitialize the connection by removing and re-establishing event handlers
    try {
      // Remove existing event handlers
      removeEventHandlers();
      
      // Reset client connection status
      setClientConnectionStatus('disconnected');
      setSelectedReader('');
      setReaders([]);
      
      // Wait a moment to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Re-set up event handlers
      setupEventHandlers();
      
      // Rediscover readers to reconnect
      setMessage('Rediscovering fingerprint readers...');
      await discoverReaders();
      
      setMessage('Connection reset. Ready to start new enrollment.');
    } catch (err) {
      console.error("Error resetting fingerprint connection:", err);
      setError(`Failed to reset connection: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Handle generate template and DID button click
  const handleGenerateTemplateAndDID = () => {
    setIsGenerating(true);
    setMessage("Generating fingerprint template and DID...");
    
    // Validate National ID is present before proceeding
    if (!nationalId) {
      setError("National ID is required. Please provide a valid National ID before generating the template.");
      setIsGenerating(false);
      return;
    }
    
    // Short delay to show processing message
    setTimeout(() => {
      processAndFinalizeFingerprintTemplate();
    }, 500);
  };
  
  // Process fingerprint data through backend API and finalize template
  const processAndFinalizeFingerprintTemplate = async () => {
    try {
      console.log("Processing fingerprint data with backend API...");
      console.log("Using National ID:", nationalId);
      
      if (!nationalId) {
        throw new Error("National ID is required for fingerprint processing. Please provide a valid National ID.");
      }
      
      // Transform fingerprint data into the requested format with "Scan X" format
      const transformedFingerprints = bioDataRef.current.fingerprints.map(fp => ({
        finger: `Scan ${fp.scanIndex}`,
        sample: fp.sample
      }));
      
      // Create the template with the format expected by the API
      const templateData = {
        fingerprints: transformedFingerprints,
        nationalId: nationalId // Include the nationalId received from props
      };
      
      // // Add download functionality - allow user to download the template data as JSON file
      // const downloadTemplateData = () => {
      //   const dataStr = JSON.stringify(templateData, null, 2);
      //   const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
      //   const exportFileDefaultName = `fingerprint-template-${bioDataRef.current.userId || 'user'}-${new Date().toISOString().slice(0,10)}.json`;
        
      //   const linkElement = document.createElement('a');
      //   linkElement.setAttribute('href', dataUri);
      //   linkElement.setAttribute('download', exportFileDefaultName);
      //   linkElement.click();
      //   linkElement.remove();
      // };
      
      // // Create and trigger download dialog
      // downloadTemplateData();
      
      // Log the template being sent to the API
      console.log('Sending fingerprint data to backend API:', templateData);
      
      // Send to the backend API
      const apiResponse = await processFingerprintTemplate(templateData);
      console.log('Received ISO template from API:', apiResponse);
      
      if (!apiResponse || apiResponse.processing_status !== 'completed') {
        throw new Error(`API processing failed: ${apiResponse?.error_message || 'Unknown error'}`);
      }
      
      // Create the final template incorporating the API response
      const finalTemplate = {
        userId: bioDataRef.current.userId,
        fingerprints: transformedFingerprints,
        iso_template_id: apiResponse.id,
        iso_template_base64: apiResponse.iso_template_base64,
        finalizedAt: new Date().toISOString()
      };
      
      // Log the complete fingerprint template
      console.log('COMPLETE FINGERPRINT TEMPLATE CREATED WITH ISO DATA:', JSON.stringify(finalTemplate, null, 2));
      
      // Update state
      setFingerprintTemplate(finalTemplate);
      setIsGenerating(false);
      
      // Call the callback if provided
      if (onEnrollmentComplete) {
        onEnrollmentComplete(finalTemplate);
      }
      
      setMessage("Template created successfully! ISO template received and DID generation process started.");
    } catch (err) {
      console.error("Error processing fingerprint template:", err);
      
      // Enhanced error message for nationalId issues
      if (err.message && err.message.includes('National ID')) {
        setError(`National ID Error: ${err.message}`);
      } else {
        setError(`Failed to process template: ${err.message}`);
      }
      
      setIsGenerating(false);
    }
  };
  
  // Handle reader selection change
  const handleReaderChange = (e) => {
    setSelectedReader(e.target.value);
  };

  // Calculate progress percentage for the progress bar - Make sure it never exceeds 100%
  const progressPercentage = Math.min((scanCount / totalScansNeeded) * 100, 100);
  
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
        {!showGenerateButton ? (
          <>
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
          </>
        ) : (
          <button
            type="button"
            className={`flex-1 py-3 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isGenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
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
        )}
        
        <button
          type="button"
          className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={resetEnrollment}
          disabled={isScanning || isGenerating}
        >
          Reset
        </button>
      </div>
      
      {/* Current scan count - shows real-time value with force render */}
      <div className="text-center font-medium text-gray-700 mb-1">
        Scans Completed: {scanCount} of {totalScansNeeded}
      </div>
      
      {/* Scan progress */}
      <div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{width: `${progressPercentage}%`}}
          ></div>
        </div>
        
        {/* Scan indicators */}
        <div className="flex justify-between mt-3">
          {Array.from({ length: totalScansNeeded }, (_, index) => (
            <div 
              key={index}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                scanCount > index 
                  ? 'bg-green-500 text-white' 
                  : scanCount === index && isScanning 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {scanCount > index ? (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scan quality indicator */}
      {scanQuality && (
        <div className="mt-3">
          <span className="block text-center text-sm font-medium text-gray-700">
            Last Scan Quality: 
            <span className={`ml-1 ${
              scanQuality === 'Good' ? 'text-green-700 font-bold' : 'text-yellow-700'
            }`}>
              {scanQuality}
            </span>
          </span>
        </div>
      )}
      
      {/* Success message when template is created */}
      {fingerprintTemplate && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm font-medium">Fingerprint template created! DID generation in progress...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintEnrollment;