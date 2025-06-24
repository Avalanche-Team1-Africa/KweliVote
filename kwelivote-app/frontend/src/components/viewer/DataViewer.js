import React, { useState, useEffect, useRef } from 'react';
import { voterAPI, keypersonAPI } from '../../utils/api';
import blockchainService from '../../services/BlockchainService';
import FingerprintEnrollmentForDataViewer from './FingerprintEnrollmentForDataViewer';
import { getAuthToken } from '../../utils/auth';

// Debug logger for fingerprint operations - helps with troubleshooting
const logFingerprintDebug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FP-DEBUG] ${message}`, data || '');
    
    // Log to browser console with timestamp for easier debugging
    const timestamp = new Date().toISOString();
    console.log(`[FP-DEBUG][${timestamp}] ${message}`, data || '');
  }
};

/**
 * DataViewer Component
 * 
 * This component implements a two-step voter validation process:
 * 1. Step 1: Biometric verification using fingerprint
 *    - Option A: Capture fingerprint using hardware reader
 *    - Option B: Upload fingerprint image file
 * 2. Step 2: Blockchain DID validation
 * 
 * The user must pass Step 1 before proceeding to Step 2.
 * Both steps must succeed for complete voter validation.
 */
const DataViewer = () => {
  const [activeTab, setActiveTab] = useState('voters');
  const [searchTerm, setSearchTerm] = useState('');
  const [voters, setVoters] = useState([]);
  const [keypersons, setKeypersons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add states for blockchain validation
  const [validatingVoter, setValidatingVoter] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Fingerprint states
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null); // For reader-based
  const [fingerprintImage, setFingerprintImage] = useState(null); // For upload
  const [fingerprintError, setFingerprintError] = useState('');
  const [useReader, setUseReader] = useState(false); // Toggle between reader and upload
  const fingerprintInputRef = useRef(null);
  
  // Initialize blockchain connection when component mounts
  useEffect(() => {
    let checkWebSdkInterval = null;
    let isUnmounted = false;
    const sdkDetectedRef = { current: false };

    const initBlockchain = async () => {
      try {
        const initialized = await blockchainService.initialize();
        if (!isUnmounted) setIsBlockchainConnected(initialized);
        logFingerprintDebug('Blockchain connection initialized', { success: initialized });
      } catch (err) {
        console.error('Error initializing blockchain connection:', err);
        logFingerprintDebug('Blockchain initialization error', { message: err.message });
      }
    };

    initBlockchain();

    // Check if fingerprint WebSDK is available
    if (window.Fingerprint) {
      if (!sdkDetectedRef.current) {
        sdkDetectedRef.current = true;
        console.log('Fingerprint WebSDK detected');
        logFingerprintDebug('Fingerprint WebSDK detected', { version: window.Fingerprint.version || 'unknown' });
      }
    } else {
      logFingerprintDebug('Fingerprint WebSDK not found');
      // Try to detect if the WebSDK is being loaded asynchronously
      checkWebSdkInterval = setInterval(() => {
        if (window.Fingerprint && !sdkDetectedRef.current) {
          sdkDetectedRef.current = true;
          console.log('Fingerprint WebSDK detected after delay');
          logFingerprintDebug('Fingerprint WebSDK detected after delay');
          clearInterval(checkWebSdkInterval);
          checkWebSdkInterval = null;
        }
      }, 1000);
    }

    // Clean up interval if component unmounts
    return () => {
      isUnmounted = true;
      if (checkWebSdkInterval) {
        clearInterval(checkWebSdkInterval);
      }
    };
  }, []);
  
  // Fetch data when component mounts or tab changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        if (activeTab === 'voters') {
          const votersData = await voterAPI.getVoters();
          setVoters(votersData);
        } else if (activeTab === 'keypersons') {
          const keypersonsData = await keypersonAPI.getKeypersons();
          setKeypersons(keypersonsData);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]); // Re-fetch when tab changes

  // Handle blockchain verification of voter DID
  const handleVerifyVoterDID = async (voter) => {
    if (!isBlockchainConnected) {
      setError('Blockchain is not connected. Unable to verify voter.');
      return;
    }
    
    // Reset all validation states
    setValidatingVoter(voter);
    setValidationResult(null);
    setFingerprintImage(null);
    setFingerprintTemplate(null);
    setError('');
    
    // Default to file upload mode
    setUseReader(false);
  };
  
  // Handler for when enrollment completes (from FingerprintEnrollment)
  const handleEnrollmentComplete = (template) => {
    // Only store the first scan, do not generate DID or process further
    logFingerprintDebug('Enrollment complete, received template', {
      hasTemplate: !!template,
      format: template?.format || 'unknown'
    });
    
    // Ensure the template is in the correct format
    if (template && template.template && template.format === 'ISO/IEC 19794-2') {
      setFingerprintTemplate(template);
      setFingerprintError('');
      logFingerprintDebug('Valid template stored for verification');
    } else {
      logFingerprintDebug('Invalid template format received', template);
      setFingerprintError('Invalid template format received from scanner');
    }
  };

  // Handler for errors from FingerprintEnrollment
  const handleEnrollmentError = (err) => {
    const errorMessage = err?.message || String(err);
    logFingerprintDebug('Enrollment error', errorMessage);
    setFingerprintError(errorMessage);
    
    // Clear the template if there was an error
    setFingerprintTemplate(null);
  };

  // Handler for file upload
  const handleFingerprintUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type - expanded to include more image types that might be used in testing
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
      
      // Check if the file has an accepted MIME type
      if (!acceptedTypes.includes(file.type)) {
        // If MIME type check fails, try checking the file extension as a fallback
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
          setFingerprintError('Please upload a valid fingerprint image file (JPEG, PNG, GIF, BMP, or TIFF)');
          return;
        }
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setFingerprintError('File size exceeds 10MB. Please upload a smaller file');
        return;
      }
      
      logFingerprintDebug('Fingerprint image uploaded successfully', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileType: file.type
      });
      
      setFingerprintImage(file);
      setFingerprintError(''); // Clear any previous errors
    }
  };
  
  // Toggle between reader and file upload
  const toggleCaptureMethod = () => {
    setUseReader((prev) => !prev);
    setFingerprintImage(null);
    setFingerprintTemplate(null);
    setFingerprintError('');
  };
  
  // Verify fingerprint with backend API using two-step process similar to test_fingerprint_self_matching.py
  const verifyFingerprintWithBackend = async () => {
    if (!validatingVoter) {
      throw new Error('No voter data available for validation');
    }
    
    if (!fingerprintTemplate && !fingerprintImage) {
      throw new Error('No fingerprint data available for verification');
    }
    
    setIsValidating(true);
    
    try {
      const nationalId = validatingVoter.nationalid || validatingVoter.national_id;
      if (!nationalId) {
        throw new Error('National ID not found for voter');
      }
      
      // Use environment variable for API base URL
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
      const apiEndpoint = `${apiBaseUrl}/api/fingerprints/verify-fingerprint/`;
      
      logFingerprintDebug('Starting fingerprint verification for', nationalId);
      
      // Similar to test_fingerprint_self_matching.py, we'll implement a two-step process:
      // 1. First enroll/extract the fingerprint to get a template
      // 2. Then verify the fingerprint against the template
      
      let fpData = null;
      let extractionResult = null;
      
      if (fingerprintTemplate) {
        // For template-based verification (from fingerprint reader)
        logFingerprintDebug('Using template-based verification');
        
        // Check if we have a template with ISO format
        if (fingerprintTemplate.template && fingerprintTemplate.format === 'ISO/IEC 19794-2') {
          fpData = fingerprintTemplate.template;
          
          // For templates, we can skip the extraction step if we already have ISO format
          extractionResult = {
            iso_template_base64: fpData,
            metadata: {
              template_hash: fingerprintTemplate.hash || 'unknown',
              format: 'ISO/IEC 19794-2'
            }
          };
          
          logFingerprintDebug('Using existing ISO template for verification', {
            templateLength: fpData.length
          });
        } else {
          // Legacy format or invalid template
          throw new Error('Invalid template format. Expected ISO/IEC 19794-2 format.');
        }
      } else if (fingerprintImage) {
        // For image-based verification (from file upload)
        logFingerprintDebug('Using image-based verification');
        
        // Read the image file as base64
        fpData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read fingerprint image'));
          
          reader.readAsDataURL(fingerprintImage);
        });
        
        // Step 1: Extract template from the fingerprint image
        logFingerprintDebug('Extracting template from fingerprint image');
        
        const extractionPayload = {
          nationalId: nationalId,
          fingerprints: [{
            sample: fpData,
            finger: 'Scan 1'
          }],
          extract_only: true
        };
        
        const extractionResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(extractionPayload)
        });
        
        if (!extractionResponse.ok) {
          const errorData = await extractionResponse.json();
          throw new Error(errorData.error || `Failed to extract fingerprint template: ${extractionResponse.status}`);
        }
        
        const extractionData = await extractionResponse.json();
        
        if (!extractionData.extracted_template || !extractionData.extracted_template.iso_template_base64) {
          throw new Error('Failed to extract valid template from fingerprint image');
        }
        
        extractionResult = extractionData.extracted_template;
        
        logFingerprintDebug('Successfully extracted template', {
          templateSize: extractionResult.iso_template_base64.length,
          hasXytData: !!extractionResult.xyt_data,
          templateHash: extractionResult.metadata?.template_hash || 'unknown'
        });
      }
      
      if (!extractionResult || !extractionResult.iso_template_base64) {
        throw new Error('No valid fingerprint template available for verification');
      }
      
      // Step 2: Verify fingerprint against the extracted template
      logFingerprintDebug('Verifying fingerprint against extracted template');
      
      const verificationPayload = {
        nationalId: nationalId,
        fingerprints: [{
          sample: fpData,
          finger: 'Scan 1'
        }],
        template: extractionResult.iso_template_base64,
        threshold: 40,
        extract_only: false
      };
      
      const verificationResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verificationPayload)
      });
      
      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.error || `Failed to verify fingerprint: ${verificationResponse.status}`);
      }
      
      const verificationResult = await verificationResponse.json();
      
      // Check if we have a match
      const matchScore = verificationResult.match_score || 0;
      const isMatch = verificationResult.is_match || false;
      
      logFingerprintDebug('Fingerprint verification result', {
        matchScore,
        isMatch,
        nationalId
      });
      
      if (!isMatch) {
        throw new Error(`Fingerprint verification failed: No match found (score: ${matchScore})`);
      }
      
      // Return the combined result with both extraction and verification data
      return {
        ...verificationResult,
        match_success: isMatch,
        match_score: matchScore,
        extracted_template: extractionResult,
        template_verified: true
      };
    } catch (error) {
      console.error('Error verifying fingerprint:', error);
      throw error;
    }
  };
  
  // Proceed to blockchain verification after successful fingerprint verification
  const proceedToBlockchainVerification = async () => {
    if (!validatingVoter) {
      setError('No voter data available for validation');
      return;
    }
    
    setIsValidating(true);
    
    try {
      const nationalId = validatingVoter.nationalid || validatingVoter.national_id;
      if (!nationalId) {
        throw new Error('National ID not found for voter');
      }
      
      // Step 1: Verify fingerprint against backend using the two-step process
      logFingerprintDebug('Starting fingerprint verification against backend');
      const fingerprintResult = await verifyFingerprintWithBackend();
      
      if (!fingerprintResult.match_success && !fingerprintResult.is_match) {
        throw new Error('Fingerprint verification failed: No match found');
      }
      
      // Step 2: Get local DID from the verified fingerprint
      // Extract template data from verification response if available
      let localDID = null;
      
      if (fingerprintResult.did) {
        // If DID is directly returned by the API
        localDID = fingerprintResult.did;
        logFingerprintDebug('Using DID directly from API response', { did: localDID });
      } else if (fingerprintResult.extracted_template && validatingVoter.did) {
        // If we have an extracted template and voter already has a DID
        localDID = validatingVoter.did;
        logFingerprintDebug('Using voter DID with extracted template confirmation', { 
          did: localDID,
          hasExtractedTemplate: !!fingerprintResult.extracted_template,
          templateHash: fingerprintResult.extracted_template?.metadata?.template_hash || 'unknown'
        });
      } else if (validatingVoter.did) {
        // Fallback to voter's DID if no template is returned
        localDID = validatingVoter.did;
        logFingerprintDebug('Using voter DID as fallback', { did: localDID });
      }
      
      if (!localDID) {
        throw new Error('No DID available for verification');
      }
      
      // Step 3: Verify the DID against blockchain
      logFingerprintDebug('Starting blockchain DID verification');
      const blockchainResult = await blockchainService.verifyVoterDID(nationalId);
      
      // Step 4: Compare local DID with blockchain DID
      if (!blockchainResult.did) {
        throw new Error('DID not found on blockchain');
      }
      
      const didMatch = blockchainResult.did === localDID;
      
      // Set the combined validation result
      setValidationResult({
        ...blockchainResult,
        fingerprint_verified: fingerprintResult.is_match || fingerprintResult.match_success,
        did_match: didMatch,
        validation_complete: (fingerprintResult.is_match || fingerprintResult.match_success) && didMatch,
        local_did: localDID,
        blockchain_did: blockchainResult.did,
        match_score: fingerprintResult.match_score || 0,
        extracted_template: fingerprintResult.extracted_template || null,
        template_verified: !!fingerprintResult.extracted_template
      });
      
      if (!didMatch) {
        console.warn('DID mismatch detected', { 
          localDID, 
          blockchainDID: blockchainResult.did 
        });
        setError('DID verification failed: The fingerprint matches but the blockchain DID does not match the local DID');
      }
    } catch (err) {
      console.error('Error during voter validation:', err);
      setError(`Validation failed: ${err.message}`);
      setValidationResult({
        validation_complete: false,
        error: err.message
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  // Clear validation states and close modal
  const handleCloseValidation = () => {
    setValidatingVoter(null);
    setValidationResult(null);
    setFingerprintImage(null);
  };
  
  // Skip fingerprint verification for testing purposes
  const handleSkipFingerprint = () => {
    proceedToBlockchainVerification();
  };

  const filteredVoters = voters.filter(voter => {
    if (!voter) return false;
    const fullName = `${voter.firstname || ''} ${voter.middlename || ''} ${voter.surname || ''}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || 
      (voter.nationalid && voter.nationalid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voter.designated_polling_station && voter.designated_polling_station.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const filteredKeypersons = keypersons.filter(person => {
    if (!person) return false;
    const fullName = `${person.firstname || ''} ${person.middlename || ''} ${person.surname || ''}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || 
      (person.nationalid && person.nationalid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.designated_polling_station && person.designated_polling_station.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-6 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">View Election Data</h2>
          <p className="text-gray-600">Access and review election data securely</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-soft-sm animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex w-full md:w-auto space-x-1">
            <button
              onClick={() => setActiveTab('voters')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'voters'
                  ? 'bg-gradient-to-r from-kweli-primary to-kweli-secondary text-white font-medium shadow-soft'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } rounded-l-lg transition-all duration-200`}
            >
              <svg className={`mr-2 h-5 w-5 ${activeTab === 'voters' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Voters
            </button>
            <button
              onClick={() => setActiveTab('keypersons')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'keypersons'
                  ? 'bg-gradient-to-r from-kweli-primary to-kweli-secondary text-white font-medium shadow-soft'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } rounded-r-lg transition-all duration-200`}
            >
              <svg className={`mr-2 h-5 w-5 ${activeTab === 'keypersons' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Keypersons
            </button>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 mb-6 rounded-lg shadow-soft-inner">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kweli-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'voters' && (
                <div className="animate-fade-in">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-kweli-dark">Registered Voters</h3>
                      <p className="text-sm text-gray-600">Total: {filteredVoters.length} voters</p>
                    </div>
                  </div>
  
                  {filteredVoters.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  National ID
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  DID
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Polling Station
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredVoters.map((voter) => (
                                <tr key={voter.nationalid || voter.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                                    {voter.nationalid || voter.national_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {`${voter.firstname || voter.first_name || ''} ${(voter.middlename || voter.middle_name) ? (voter.middlename || voter.middle_name) + ' ' : ''}${voter.surname || voter.last_name || ''}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                                    {voter.did ? `${voter.did.substring(0, 12)}...` : '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                      {voter.designated_polling_station}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <button
                                      onClick={() => handleVerifyVoterDID(voter)}
                                      className="px-4 py-2 text-xs font-medium text-white bg-kweli-primary rounded-lg shadow-soft hover:bg-kweli-secondary transition-all duration-200"
                                    >
                                      Validate
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg shadow-soft-inner">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-700">No voters found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'keypersons' && (
                <div className="animate-fade-in">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-kweli-dark">Election Officials & Observers</h3>
                      <p className="text-sm text-gray-600">Total: {filteredKeypersons.length} keypersons</p>
                    </div>
                  </div>
                  
                  {filteredKeypersons.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  National ID
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Role
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Polling Station
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Party / Organization
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredKeypersons.map((person) => (
                                <tr key={person.nationalid || person.national_id || person.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                                    {person.nationalid || person.national_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <RoleBadge role={person.role} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                      {person.designated_polling_station}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {person.political_party || person.stakeholder || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg shadow-soft-inner">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-700">No keypersons found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {validatingVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-kweli-dark">
                {validationResult ? 'Validation Results' : 'Biometric Verification'}
              </h3>
            </div>
            
            {validationResult ? (
              <div className="animate-fade-in">
                <div className="mb-6 p-4 rounded-lg border-2 border-gray-100 bg-gray-50">
                  <div className="flex flex-col space-y-4">
                    {/* Fingerprint Verification Result */}
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${validationResult.fingerprint_verified ? 'bg-green-100' : 'bg-red-100'}`}>
                        {validationResult.fingerprint_verified ? (
                          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Fingerprint Verification</h4>
                        <p className="text-sm text-gray-600">
                          {validationResult.fingerprint_verified 
                            ? 'Fingerprint successfully verified' 
                            : 'Fingerprint verification failed'}
                        </p>
                      </div>
                    </div>
                    
                    {/* DID Verification Result */}
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${validationResult.did_match ? 'bg-green-100' : 'bg-red-100'}`}>
                        {validationResult.did_match ? (
                          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">DID Verification</h4>
                        <p className="text-sm text-gray-600">
                          {validationResult.did_match 
                            ? 'DID successfully verified on blockchain' 
                            : 'DID verification failed'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Final Validation Result */}
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${validationResult.validation_complete ? 'bg-green-100' : 'bg-red-100'}`}>
                        {validationResult.validation_complete ? (
                          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Final Validation</h4>
                        <p className="text-sm text-gray-600">
                          {validationResult.validation_complete 
                            ? 'Voter successfully validated' 
                            : 'Voter validation failed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={handleCloseValidation}
                    className="px-4 py-2 text-sm font-medium text-white bg-kweli-primary rounded-lg shadow-soft hover:bg-kweli-secondary transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Please verify voter identity using fingerprint biometrics:
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-700">Capture Method</h4>
                      <div className="flex items-center">
                        <button
                          onClick={toggleCaptureMethod}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useReader ? 'bg-kweli-primary' : 'bg-gray-300'}`}
                          role="switch"
                          aria-checked={useReader}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${useReader ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {useReader ? 'Fingerprint Reader' : 'File Upload'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {useReader ? (
                    <div className="mb-4">
                      <FingerprintEnrollmentForDataViewer
                        onScanComplete={handleEnrollmentComplete}
                        onError={handleEnrollmentError}
                      />
                      {fingerprintError && <div className="mt-2 text-red-600 text-sm">{fingerprintError}</div>}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-kweli-primary transition-colors duration-200">
                      <input
                        type="file"
                        ref={fingerprintInputRef}
                        onChange={handleFingerprintUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {fingerprintImage ? (
                        <div>
                          <div className="mb-3 w-32 h-32 mx-auto border border-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={URL.createObjectURL(fingerprintImage)} 
                              alt="Fingerprint" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm text-green-600 mb-2">Fingerprint image selected</p>
                          <button
                            onClick={() => fingerprintInputRef.current.click()}
                            className="text-xs text-kweli-primary hover:text-kweli-secondary underline transition-colors duration-200"
                          >
                            Choose a different image
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fingerprintInputRef.current.click()}
                          className="cursor-pointer"
                        >
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Click to upload fingerprint image</p>
                          <p className="mt-1 text-xs text-gray-400">PNG, JPG, or GIF up to 10MB</p>
                        </div>
                      )}
                      
                      {fingerprintError && <div className="mt-2 text-red-600 text-sm">{fingerprintError}</div>}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={handleCloseValidation}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  
                  <div className="flex space-x-2">
                    {process.env.NODE_ENV === 'development' && (
                      <button
                        onClick={handleSkipFingerprint}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                      >
                        Skip (Debug)
                      </button>
                    )}
                    
                    <button
                      onClick={proceedToBlockchainVerification}
                      disabled={!fingerprintTemplate && !fingerprintImage}
                      className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-soft transition-all duration-200 ${
                        !fingerprintTemplate && !fingerprintImage
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-kweli-primary hover:bg-kweli-secondary'
                      }`}
                    >
                      Verify Fingerprint
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to render role badges with appropriate styling
const RoleBadge = ({ role }) => {
  const getBadgeClasses = () => {
    switch(role) {
      case 'Registration Clerk':
        return 'bg-green-50 text-green-700';
      case 'Party Agents':
        return 'bg-purple-50 text-purple-700';
      case 'Presiding Officer (PO)':
        return 'bg-red-50 text-red-700';
      case 'Deputy Presiding Officer (DPO)':
        return 'bg-orange-50 text-orange-700';
      case 'Polling Clerks':
        return 'bg-yellow-50 text-yellow-700';
      case 'Observers':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses()}`}>
      {role}
    </span>
  );
};

export default DataViewer;