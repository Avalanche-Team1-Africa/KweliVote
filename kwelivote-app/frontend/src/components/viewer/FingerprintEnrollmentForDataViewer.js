// Dedicated fingerprint enrollment for DataViewer.js
// Decoupled from Voters module logic
import React, { useState, useEffect, useRef } from 'react';

const FingerprintEnrollmentForDataViewer = ({ onScanComplete, onError, nationalId }) => {
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCaptured, setScanCaptured] = useState(false);
  const [message, setMessage] = useState('Connect to a fingerprint reader to begin');
  const [error, setError] = useState('');
  const [scanQuality, setScanQuality] = useState(null);
  const [fingerprintSample, setFingerprintSample] = useState(null);
  const [clientConnectionStatus, setClientConnectionStatus] = useState('disconnected');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const sdkRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Fingerprint) {
      setError('Fingerprint SDK WebApi not available. Please check script loading.');
      return;
    }
    const clientURI = process.env.REACT_APP_FINGERPRINT_CLIENT_URI || "http://172.19.0.1:15896";
    try {
      sdkRef.current = new window.Fingerprint.WebApi({
        useClient: true,
        clientURI: clientURI
      });
      setupEventHandlers();
    } catch (err) {
      setError(`Error initializing WebApi: ${err.message}`);
    }
    return () => {
      if (sdkRef.current) {
        removeEventHandlers();
        sdkRef.current = null;
      }
    };
  }, []);

  const setupEventHandlers = () => {
    if (!sdkRef.current) return;
    sdkRef.current.onDeviceConnected = (e) => {
      setMessage(`Reader connected: ${e.deviceUid}`);
    };
    sdkRef.current.onDeviceDisconnected = (e) => {
      setMessage(`Reader disconnected: ${e.deviceUid}`);
      setSelectedReader('');
      setIsScanning(false);
    };
    sdkRef.current.onSamplesAcquired = (s) => {
      handleSampleAcquired(s);
    };
    sdkRef.current.onQualityReported = (e) => {
      const qualityMap = {
        0: "Good",
        1: "NoImage", 2: "TooLight", 3: "TooDark", 4: "TooNoisy", 5: "LowContrast",
        6: "NotEnoughFeatures", 7: "NotCentered", 8: "NotAFinger", 9: "TooHigh", 10: "TooLow",
        11: "TooLeft", 12: "TooRight", 13: "TooStrange", 14: "TooFast", 15: "TooSkewed",
        16: "TooShort", 17: "TooSlow", 18: "ReverseMotion"
      };
      setScanQuality(qualityMap[e.quality] || `Unknown (${e.quality})`);
    };
    sdkRef.current.onErrorOccurred = (e) => {
      setError(`WebApi error: ${e.error || JSON.stringify(e)}`);
      setIsScanning(false);
      if (onError) onError(e);
    };
    sdkRef.current.onCommunicationFailed = (e) => {
      setError("Communication with fingerprint reader failed");
      setIsScanning(false);
      setClientConnectionStatus('disconnected');
      if (onError) onError(e);
    };
  };
  const removeEventHandlers = () => {
    if (!sdkRef.current) return;
    sdkRef.current.onDeviceConnected = null;
    sdkRef.current.onDeviceDisconnected = null;
    sdkRef.current.onSamplesAcquired = null;
    sdkRef.current.onQualityReported = null;
    sdkRef.current.onErrorOccurred = null;
    sdkRef.current.onCommunicationFailed = null;
  };

  const discoverReaders = async () => {
    setIsConnecting(true);
    setError('');
    setClientConnectionStatus('connecting');
    try {
      if (!sdkRef.current) throw new Error("SDK not initialized");
      const devices = await sdkRef.current.enumerateDevices();
      if (devices && devices.length > 0) {
        setReaders(devices);
        setSelectedReader(devices[0]);
        setClientConnectionStatus('connected');
        setMessage(`Found ${devices.length} reader(s). Ready to scan.`);
      } else {
        setReaders([]);
        setMessage("No fingerprint readers detected. Please connect a reader and try again.");
        setClientConnectionStatus('connected');
      }
    } catch (err) {
      setError(`Failed to discover readers: ${err.message || err}`);
      setClientConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const startCapture = async () => {
    if (!selectedReader) {
      setError("Please select a reader first");
      return;
    }
    setError('');
    try {
      const sampleFormat = window.Fingerprint.SampleFormat.PngImage;
      setupEventHandlers();
      await sdkRef.current.startAcquisition(sampleFormat, selectedReader);
      setIsScanning(true);
      setMessage(`Place your finger on the reader to capture.`);
    } catch (err) {
      setError(`Failed to start scan: ${err.message || err}`);
      setIsScanning(false);
    }
  };

  const stopCapture = async () => {
    if (!isScanning) return;
    try {
      await sdkRef.current.stopAcquisition(selectedReader);
    } catch (err) {}
    setIsScanning(false);
  };

  // Only capture one scan, do not generate DID, and enable "Validate Fingerprint" after scan
  const handleSampleAcquired = (sampleData) => {
    if (scanCaptured) return; // Only allow one scan
    let extractedSample = null;
    let samples = null;
    try {
      if (!sampleData) throw new Error('No sample data');
      if (!sampleData.samples) throw new Error('No samples in data');
      samples = typeof sampleData.samples === 'string' ? JSON.parse(sampleData.samples) : sampleData.samples;
      if (!Array.isArray(samples) || samples.length === 0) throw new Error('No valid samples');
      if (sampleData.sampleFormat === window.Fingerprint.SampleFormat.PngImage && samples.length > 0) {
        extractedSample = samples[0];
      } else {
        throw new Error('Unsupported sample format or empty sample');
      }
    } catch (err) {
      setError(`Error parsing scan: ${err.message}`);
      if (onError) onError(err);
      return;
    }
    setFingerprintSample(extractedSample);
    setScanCaptured(true);
    setIsScanning(false);
    setMessage('Fingerprint scan captured. Ready to validate.');
    if (onScanComplete) onScanComplete(extractedSample);
    stopCapture();
  };

  const handleReaderChange = (e) => {
    setSelectedReader(e.target.value);
  };

  const resetEnrollment = async () => {
    await stopCapture();
    setScanCaptured(false);
    setFingerprintSample(null);
    setError('');
    setMessage('Reinitializing connection...');
    setClientConnectionStatus('disconnected');
    setSelectedReader('');
    setReaders([]);
    setupEventHandlers();
    setMessage('Rediscovering fingerprint readers...');
    await discoverReaders();
    setMessage('Connection reset. Ready to start new scan.');
  };

  // --- NEW: Validate Fingerprint Handler ---
  const handleValidateFingerprint = async () => {
    if (!fingerprintSample || !nationalId) {
      setError('No fingerprint scan or national ID available.');
      return;
    }
    setIsValidating(true);
    setError('');
    setValidationResult(null);
    try {
      // Prepare FormData for file upload
      const formData = new FormData();
      // The backend expects a file named 'fingerprint'
      // Convert base64 PNG to Blob
      const byteString = atob(fingerprintSample.split(',')[1] || fingerprintSample);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/png' });
      formData.append('fingerprint', blob, 'scan.png');
      formData.append('national_id', nationalId);
      // Optionally add CSRF or auth token if needed
      const response = await fetch('/api/fingerprints/verify-fingerprint/', {
        method: 'POST',
        body: formData,
        credentials: 'include', // send cookies if needed
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Fingerprint validation failed');
      }
      const data = await response.json();
      setValidationResult(data);
      setMessage(data.is_match ? 'Fingerprint match successful!' : 'No match found.');
    } catch (err) {
      setError(err.message || 'Error validating fingerprint');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg bg-gray-50 p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      )}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Fingerprint Reader</label>
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
              <option key={reader} value={reader}>{reader.substring(0, 15)}...</option>
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
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">{message}</div>
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          className={`flex-1 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            !selectedReader || isScanning || scanCaptured 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          }`}
          onClick={startCapture}
          disabled={!selectedReader || isScanning || scanCaptured}
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
      {scanCaptured && (
        <button
          type="button"
          className={`w-full py-2 mt-2 rounded-md text-white font-semibold ${isValidating ? 'bg-gray-400' : 'bg-kweli-primary hover:bg-kweli-secondary'}`}
          onClick={handleValidateFingerprint}
          disabled={isValidating}
        >
          {isValidating ? 'Validating...' : 'Validate Fingerprint'}
        </button>
      )}
      {validationResult && (
        <div className={`mt-3 p-3 rounded-md ${validationResult.is_match ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border`}> 
          {validationResult.is_match ? (
            <span>Fingerprint match successful! Score: {validationResult.match_score}</span>
          ) : (
            <span>No match found.</span>
          )}
        </div>
      )}
      <div className="text-center font-medium text-gray-700 mb-1">
        {scanCaptured ? 'Scan captured.' : 'No scan yet.'}
      </div>
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
      {fingerprintSample && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm font-medium">Fingerprint scan captured! Ready to validate.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FingerprintEnrollmentForDataViewer;
