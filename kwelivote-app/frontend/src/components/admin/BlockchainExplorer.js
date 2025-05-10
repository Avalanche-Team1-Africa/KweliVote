import React, { useState, useEffect } from 'react';
import blockchainService from '../../services/BlockchainService';
import FingerprintEnrollment from '../voter/FingerprintEnrollment';
import biometricToDID from '../../utils/biometricToDID';

const BlockchainExplorer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessingDID, setIsProcessingDID] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState({
    initialized: false,
    message: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [verificationMode, setVerificationMode] = useState('id-only'); // 'id-only' or 'fingerprint'
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [generatedDID, setGeneratedDID] = useState(null);
  
  // Add log entry with timestamp
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    const newLog = { timestamp, message, type };
    
    // Add to logs state
    setLogs(prevLogs => [...prevLogs, newLog]);
    
    // Also log to console with appropriate styling for debugging
    switch(type) {
      case 'error':
        console.error(`[${timestamp}] ${message}`);
        break;
      case 'warning':
        console.warn(`[${timestamp}] ${message}`);
        break;
      case 'success':
        console.log(`%c[${timestamp}] ${message}`, 'color: green; font-weight: bold;');
        break;
      default:
        console.log(`[${timestamp}] ${message}`);
    }
  };

  useEffect(() => {
    const initBlockchain = async () => {
      try {
        addLog('Initializing blockchain connection...', 'info');
        const isInitialized = await blockchainService.initialize();
        setBlockchainStatus({
          initialized: isInitialized,
          message: isInitialized 
            ? 'Connected to Avalanche blockchain' 
            : 'Blockchain not configured. Please set up the blockchain infrastructure first.'
        });
        
        if (isInitialized) {
          addLog('Blockchain connection successful', 'success');
          const networkInfo = blockchainService.getNetworkInfo();
          addLog(`Connected to network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`, 'info');
          
          if (blockchainService.voterDIDContractAddress) {
            addLog(`VoterDID contract found at: ${blockchainService.voterDIDContractAddress}`, 'info');
          } else {
            addLog('No VoterDID contract detected. Please deploy a contract first.', 'warning');
          }
        } else {
          addLog('Failed to connect to blockchain', 'error');
        }
      } catch (err) {
        console.error('Failed to initialize blockchain service:', err);
        addLog(`Blockchain initialization error: ${err.message}`, 'error');
        setBlockchainStatus({
          initialized: false,
          message: `Blockchain initialization error: ${err.message}`
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initBlockchain();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a National ID to search');
      return;
    }
    
    setError('');
    setSearchResult(null);
    setIsVerifying(true);
    
    try {
      // Use the appropriate verification method based on mode
      const result = verificationMode === 'id-only' || !fingerprintTemplate
        ? await blockchainService.verifyVoterDID(searchTerm)
        : await blockchainService.verifyVoterDIDWithFingerprint(searchTerm, fingerprintTemplate);
      
      if (result.success) {
        setSearchResult({
          nationalId: searchTerm,
          did: result.did,
          isVerified: result.isVerified,
          message: result.message
        });
      } else {
        throw new Error(result.error || 'Failed to verify voter DID');
      }
    } catch (err) {
      console.error('Error verifying voter DID:', err);
      setError(err.message || 'An error occurred while searching the blockchain');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnrollmentComplete = (templateData) => {
    addLog('Fingerprint enrollment completed', 'success');
    addLog(`ISO template size: ${templateData.iso_template_base64.length} bytes`, 'info');
    setFingerprintTemplate(templateData);
  };

  const handleModeChange = (mode) => {
    setVerificationMode(mode);
    setSearchResult(null); // Clear previous results when changing modes
    setGeneratedDID(null);
    setError('');
    addLog(`Verification mode changed to: ${mode}`, 'info');
  };
  
  const generateDidAndVerify = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a National ID');
      addLog('Operation failed: National ID is required', 'error');
      return;
    }
    
    if (!fingerprintTemplate) {
      setError('Please capture a fingerprint first');
      addLog('Operation failed: Fingerprint capture is required', 'error');
      return;
    }
    
    setError('');
    setSearchResult(null);
    setGeneratedDID(null);
    setIsProcessingDID(true);
    
    try {
      // Step 1: Generate DID from fingerprint
      addLog('STEP 1: Generating DID from fingerprint template', 'info');
      const didResult = biometricToDID(fingerprintTemplate, searchTerm, false); // false = voter
      addLog(`DID generated successfully: ${didResult.didKey}`, 'success');
      
      // Store the generated DID to display later
      setGeneratedDID(didResult);
      
      // Step 2: Verify on blockchain
      addLog('STEP 2: Verifying against blockchain', 'info');
      const verificationResult = await blockchainService.verifyVoterDID(searchTerm);
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Failed to verify on blockchain');
      }
      
      addLog(`Blockchain verification result: ${JSON.stringify(verificationResult)}`, 'info');
      
      // Step 3: Compare DIDs
      if (verificationResult.isVerified) {
        const didMatch = didResult.didKey === verificationResult.did;
        
        addLog(
          didMatch 
            ? 'Generated DID matches blockchain DID ✅' 
            : 'Generated DID does NOT match blockchain DID ❌', 
          didMatch ? 'success' : 'error'
        );
        
        setSearchResult({
          nationalId: searchTerm,
          generatedDid: didResult.didKey,
          blockchainDid: verificationResult.did,
          isVerified: didMatch,
          message: didMatch 
            ? 'Verification successful: Fingerprint matches blockchain identity' 
            : 'Verification failed: Fingerprint does not match blockchain identity'
        });
      } else {
        addLog('No DID found on blockchain for this National ID', 'warning');
        setSearchResult({
          nationalId: searchTerm,
          generatedDid: didResult.didKey,
          blockchainDid: null,
          isVerified: false,
          message: 'No identity found on blockchain for this voter'
        });
      }
    } catch (err) {
      console.error('Error during DID generation and verification:', err);
      addLog(`Error: ${err.message}`, 'error');
      setError(err.message || 'An error occurred during DID generation and verification');
    } finally {
      setIsProcessingDID(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kweli-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-2">Blockchain DID Explorer</h2>
          <p className="text-gray-600">
            Search and verify voter DIDs stored on the Avalanche subnet
          </p>
        </div>
        
        {/* Blockchain Status */}
        <div className={`mb-6 p-4 rounded-lg border ${blockchainStatus.initialized ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center">
            {blockchainStatus.initialized ? (
              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-yellow-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`font-medium ${blockchainStatus.initialized ? 'text-green-800' : 'text-yellow-800'}`}>
              {blockchainStatus.message}
            </span>
          </div>
        </div>
        
        {!blockchainStatus.initialized ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-blue-700">Please set up the blockchain infrastructure before using the explorer.</p>
                <p className="text-blue-700 mt-1">Navigate to the blockchain setup page to configure the Avalanche subnet.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Verification Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Method
              </label>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => handleModeChange('id-only')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${verificationMode === 'id-only'
                    ? 'bg-kweli-primary text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    National ID Only
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('fingerprint')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${verificationMode === 'fingerprint'
                    ? 'bg-kweli-primary text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd" />
                    </svg>
                    Fingerprint + ID
                  </div>
                </button>
              </div>
            </div>
            
            {/* Fingerprint capture section (shown only in fingerprint mode) */}
            {verificationMode === 'fingerprint' && (
              <div className="mb-6">
                <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-blue-800 mb-2">Fingerprint Verification</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Please scan the voter's fingerprint for verification against their blockchain identity.
                  </p>
                  
                  <FingerprintEnrollment 
                    onEnrollmentComplete={handleEnrollmentComplete}
                    requiredScans={1}
                  />
                  
                  {fingerprintTemplate && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-green-700">Fingerprint scan complete</p>
                      </div>
                    </div>
                  )}

                  {/* Generate DID and verify on blockchain button */}
                  {fingerprintTemplate && searchTerm && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={generateDidAndVerify}
                        disabled={isProcessingDID || !searchTerm.trim()}
                        className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-white font-medium ${
                          isProcessingDID || !searchTerm.trim()
                            ? 'bg-blue-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                      >
                        {isProcessingDID ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Generate DID and verify on blockchain
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Debug logs section - collapsible */}
            {verificationMode === 'fingerprint' && (
              <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Debug Logs</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {logs.length}
                    </span>
                  </div>
                  <svg className={`h-5 w-5 text-gray-500 transition-transform ${showLogs ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showLogs && (
                  <div className="max-h-64 overflow-y-auto bg-gray-900 p-4 font-mono text-xs">
                    {logs.map((log, index) => (
                      <div key={index} className={`pb-1 ${
                        log.type === 'error' ? 'text-red-400' : 
                        log.type === 'warning' ? 'text-yellow-400' : 
                        log.type === 'success' ? 'text-green-400' : 
                        'text-blue-300'
                      }`}>
                        <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-gray-400">No logs yet.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Search form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
                    National ID
                  </label>
                  <input
                    id="nationalId"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter national ID to verify"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary"
                    disabled={isVerifying}
                  />
                </div>
                <div className="self-end">
                  <button
                    type="submit"
                    className={`w-full md:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-white
                      ${(verificationMode === 'fingerprint' && !fingerprintTemplate)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-kweli-primary hover:bg-kweli-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary'
                      }`}
                    disabled={isVerifying || !searchTerm.trim() || (verificationMode === 'fingerprint' && !fingerprintTemplate)}
                  >
                    {isVerifying ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </div>
                    ) : 'Verify DID'}
                  </button>
                </div>
              </div>
            </form>
            
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {searchResult && (
              <div className="mb-6">
                <div className={`border rounded-lg overflow-hidden ${searchResult.isVerified ? 'border-green-200' : 'border-yellow-200'}`}>
                  <div className={`px-4 py-3 ${searchResult.isVerified ? 'bg-green-50' : 'bg-yellow-50'} border-b ${searchResult.isVerified ? 'border-green-200' : 'border-yellow-200'}`}>
                    <h3 className="text-lg font-medium text-gray-900">Verification Result</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">National ID</p>
                        <p className="mt-1 text-sm text-gray-900">{searchResult.nationalId}</p>
                      </div>
                      
                      {/* Show both generated and blockchain DIDs if available */}
                      {searchResult.generatedDid && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Generated DID (from fingerprint)</p>
                          <p className="mt-1 text-sm text-gray-900 font-mono break-all">{searchResult.generatedDid}</p>
                        </div>
                      )}
                      
                      {searchResult.blockchainDid ? (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Blockchain DID</p>
                          <p className="mt-1 text-sm text-gray-900 font-mono break-all">{searchResult.blockchainDid}</p>
                        </div>
                      ) : searchResult.did ? (
                        <div>
                          <p className="text-sm font-medium text-gray-500">DID</p>
                          <p className="mt-1 text-sm text-gray-900 font-mono break-all">{searchResult.did}</p>
                        </div>
                      ) : null}
                      
                      <div>
                        <div className="flex items-center">
                          {searchResult.isVerified ? (
                            <>
                              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-green-700 font-medium">{searchResult.message}</p>
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 text-yellow-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <p className="text-yellow-700 font-medium">{searchResult.message}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Information section */}
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About Blockchain Verification</h3>
            <p className="text-sm text-gray-600 mb-2">
              The KweliVote system stores voter Decentralized Identifiers (DIDs) on a custom Avalanche blockchain subnet to ensure
              the integrity and transparency of the voter registration process.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">National ID Verification:</span> Confirms that a voter's ID is registered in the system.
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Fingerprint Verification:</span> Provides stronger authentication by matching the voter's fingerprint against their blockchain identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;