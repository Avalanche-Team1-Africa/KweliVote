import React, { useState, useEffect, useRef } from 'react';
import BiometricInput from '../shared/BiometricInput'; // Import the shared component
import biometricToDID from '../../utils/biometricToDID';
import apiServices from '../../utils/api';
import blockchainService from '../../services/BlockchainService';

const KeypersonStep2 = ({ formData, nextStep, prevStep, isObserver, onEnrollmentComplete, isEditMode, handleSubmit, error, successMessage, isSubmitting, showSuccess }) => {
  const [showLocalSuccess, setShowLocalSuccess] = useState(false);
  const [localSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [localFingerprintError, setLocalFingerprintError] = useState('');
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [didResult, setDidResult] = useState(null);
  const [conversionLog, setConversionLog] = useState([]);
  const [showConversionDetails, setShowConversionDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [blockchainTxInfo, setBlockchainTxInfo] = useState(null);
  const [isSavingToBlockchain, setIsSavingToBlockchain] = useState(false);
  const [blockchainAddress, setBlockchainAddress] = useState('');
  const [blockchainError, setBlockchainError] = useState('');
  
  // Add a processing flag ref to prevent multiple executions
  const isProcessingRef = useRef(false);
  // Add template ID tracking to avoid reprocessing the same template
  const processedTemplateIdRef = useRef(null);

  useEffect(() => {
    // Debug log to check if environment variables are loaded
    console.log('Environment variables check:');
    console.log('REACT_APP_ADMIN_PRIVATE_KEY exists:', process.env.REACT_APP_ADMIN_PRIVATE_KEY ? 'Yes' : 'No');
    console.log('Private key length:', process.env.REACT_APP_ADMIN_PRIVATE_KEY ? process.env.REACT_APP_ADMIN_PRIVATE_KEY.length : 0);
    // Don't log the actual key for security reasons
  }, []);

  const workflowSteps = [
    { id: 'fingerprint', label: 'Fingerprint' },
    { id: 'template', label: 'Template' },
    { id: 'stabilization', label: 'Stabilization' },
    { id: 'secretKey', label: 'Secret Key' },
    { id: 'hash', label: 'Hash' },
    { id: 'keyPair', label: 'Key Pair' },
    { id: 'did', label: 'DID:key' }
  ];

  const handleNext = async (e) => {
    e.preventDefault();
    
    // For observers and edit mode, submit the form directly
    if (isEditMode || isObserver) {
      if (handleSubmit) {
        handleSubmit(e);
      }
      
      // After a short delay to ensure the keyperson has been created/updated
      setTimeout(() => {
        // Show success message with blockchain details for both new and existing keypersons
        // Only proceed with biometric data if we have both DID and template
        if (didResult && fingerprintTemplate?.iso_template_base64) {
          console.log('Submitting with DID:', didResult.didKey);
          
          // Access keyperson ID from formData, which should be updated after keyperson creation/update
          const keypersonId = formData.id || formData.nationalid;
          
          // Debug log to help identify issues with formData
          console.log('Current formData:', formData);
          console.log('FormData.designated_polling_station:', formData.designated_polling_station);
          console.log('FormData.designatedPollingStation:', formData.designatedPollingStation);
          console.log('FormData.polling_station:', formData.polling_station);
          
          if (keypersonId) {
            // Validate that all required fields are present in formData
            const requiredFields = ['nationalid', 'firstname', 'surname', 'role'];
            const missingFields = requiredFields.filter(field => !formData[field]);
            
            // Special handling for designated_polling_station which might be in different formats
            if (!formData.designated_polling_station && 
                !formData.designatedPollingStation && 
                !formData.polling_station && 
                !formData.pollingStation) {
              missingFields.push('polling station');
            }
            
            if (missingFields.length > 0) {
              console.error('Missing required fields:', missingFields);
              setLocalFingerprintError(`Cannot save data: Missing required fields: ${missingFields.join(', ')}`);
              return;
            }
            
            const biometricData = {
              did: didResult.didKey,
              biometric_template: fingerprintTemplate.iso_template_base64,
              private_key: didResult.privateKey,
              public_key: didResult.publicKey
            };
            
            // Set loading state for blockchain
            setIsSavingToBlockchain(true);
            setBlockchainError('');
            
            // Initialize blockchain service
            blockchainService.initialize().then(isInitialized => {
              if (isInitialized) {
                // For keypersons, we use a derived address from the DID itself
                const didHash = didResult.didKey.substring(didResult.didKey.lastIndexOf(':') + 1);
                const address = `0x${didHash.substring(0, 40)}`;
                setBlockchainAddress(address);
                
                // For demo purposes, we use a development private key
                // In production, this should be securely managed by an admin
                // This is a test private key with no real funds - NEVER use this in production
                const adminPrivateKey = process.env.REACT_APP_ADMIN_PRIVATE_KEY || 
                  'A7b9f6989ff480042ecfdb0f1aee605ec59a6b0937adf9264e4c6fbbfef295bc'; // Fallback key for development only
                
                console.log('Using private key for blockchain operation');

                // Import the private key for signing
                const importResult = blockchainService.importPrivateKey(adminPrivateKey);
                if (!importResult.success) {
                  throw new Error(`Failed to import admin key: ${importResult.error}`);
                }
                
                // Save DID to blockchain
                return blockchainService.storeDID(keypersonId, didResult.didKey);
              } else {
                throw new Error('Failed to initialize blockchain connection');
              }
            }).then(result => {
              if (result.success) {
                // Store blockchain transaction information
                setBlockchainTxInfo({
                  transactionHash: result.transactionHash,
                  blockNumber: result.blockNumber
                });
                
                // Get blockchain network information
                const networkInfo = blockchainService.getNetworkInfo();
                
                // Prepare a valid polling station value - this is critical to prevent 400 errors
                let pollingStationValue = '';
                // Check for both camelCase and snake_case versions of the field
                if (formData.designatedPollingStation) {
                  pollingStationValue = formData.designatedPollingStation;
                } else if (formData.designated_polling_station) {
                  pollingStationValue = formData.designated_polling_station;
                } else if (formData.polling_station) {
                  pollingStationValue = formData.polling_station;
                } else if (formData.pollingStation) {
                  pollingStationValue = formData.pollingStation;
                } else if (formData.station_id) {
                  pollingStationValue = formData.station_id;
                } else if (formData.stationId) {
                  pollingStationValue = formData.stationId;
                } else {
                  // Last resort fallback - if all else fails, use a placeholder
                  // This should be replaced with a meaningful default in production
                  pollingStationValue = 'DEFAULT_STATION';
                }
                
                console.log('Using polling station value:', pollingStationValue);
                
                // Prepare the request data object with all required fields
                // IMPORTANT: The updateKeyperson API expects camelCase for certain fields
                const updateData = {
                  // Include required fields from formData
                  nationalid: formData.nationalid,
                  firstname: formData.firstname,
                  surname: formData.surname,
                  role: formData.role,
                  // Use camelCase here as the API expects it
                  designatedPollingStation: pollingStationValue, // This is the key fix - using camelCase format
                  // Add blockchain information
                  blockchain_tx_id: result.transactionHash,
                  blockchain_subnet_id: networkInfo.name || 'Avalanche C-Chain'
                };
                
                // Debug log the complete request payload
                console.log('Sending update request with data:', JSON.stringify(updateData, null, 2));
                console.log('Field format check - designatedPollingStation exists:', updateData.hasOwnProperty('designatedPollingStation'));
                console.log('Field format check - designated_polling_station exists:', updateData.hasOwnProperty('designated_polling_station'));
                
                // Update the keyperson record with the blockchain transaction ID and network name
                return apiServices.keyperson.updateKeyperson(keypersonId, updateData);
              } else {
                throw new Error(result.error || 'Failed to store DID on blockchain');
              }
            })
            .then(() => {
              // After updating the blockchain_tx_id, save biometric data
              // This works for both new and existing keypersons
              return apiServices.keyperson.saveBiometricData(keypersonId, biometricData);
            })
            .then(response => {
              console.log('Data saved successfully:', response);
              console.log('Blockchain transaction details:', blockchainTxInfo);
              console.log('DID result:', didResult);
              console.log('Blockchain address:', blockchainAddress);
              
              // Ensure we have transaction info for display (this would be available for both new and existing keypersons)
              if (blockchainTxInfo) {
                console.log('Blockchain transaction hash available for display:', blockchainTxInfo.transactionHash);
              }
              
              // Show success modal with all required information
              setShowSuccessMessage(true);
              setIsSavingToBlockchain(false);
              
              setTimeout(() => {
                setShowSuccessMessage(false);
              }, 10000); // Show for longer (10 seconds) to give users time to read the blockchain details
            })
            .catch(error => {
              console.error('Error saving data:', error);
              // Log more details about the error for debugging
              if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
                
                // Add specific error handling for missing fields
                if (error.response.status === 400) {
                  const errorData = error.response.data;
                  // Check for specific field errors
                  if (errorData) {
                    // Create a more user-friendly error message
                    let detailedErrorMsg = 'API Error: ';
                    
                    if (typeof errorData === 'object') {
                      // Check for specific field errors
                      if (errorData.designatedPollingStation) {
                        detailedErrorMsg += `Polling Station: ${errorData.designatedPollingStation}. `;
                      } else if (errorData.designated_polling_station) {
                        detailedErrorMsg += `Polling Station: ${errorData.designated_polling_station}. `;
                      }
                      
                      // Check for general detail field
                      if (errorData.detail) {
                        detailedErrorMsg += errorData.detail;
                      } else {
                        // Otherwise list all error fields
                        detailedErrorMsg += Object.keys(errorData).map(key => 
                          `${key}: ${errorData[key]}`
                        ).join('; ');
                      }
                    } else {
                      detailedErrorMsg += JSON.stringify(errorData);
                    }
                    
                    // Set the detailed error message
                    setLocalFingerprintError(detailedErrorMsg);
                    setBlockchainError('Failed to update record due to field validation errors');
                    setIsSavingToBlockchain(false);
                    return;
                  }
                }
              } else if (error.request) {
                console.error('Error request:', error.request);
              } else {
                console.error('Error message:', error.message);
              }
              setLocalFingerprintError(`Failed to save data: ${error.message || 'Unknown error'}`);
              setBlockchainError(error.message || 'Failed to store DID on blockchain');
              setIsSavingToBlockchain(false);
            });
          } else {
            console.error('Cannot save biometric data: No keyperson ID available');
            setLocalFingerprintError('Cannot save biometric data: No keyperson ID available');
          }
        } else {
          // If no biometric data is available, still show success message
          // as the keyperson details might have been saved successfully
          
          // Generate placeholder blockchain details for display consistency
          if (!blockchainAddress && didResult) {
            const didHash = didResult.didKey.substring(didResult.didKey.lastIndexOf(':') + 1);
            const address = `0x${didHash.substring(0, 40)}`;
            setBlockchainAddress(address);
          }
          
          // Show the success message with whatever blockchain information we have
          setShowSuccessMessage(true);
          
          // For consistency with the biometric flow, show for 10 seconds for both new and existing keypersons
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 10000);
        }
      }, 500); // Short delay to ensure keyperson is saved first
    } else {
      // For new keypersons not in edit mode, just proceed to the next step
      // Biometric data will be saved after the full registration process is complete
      nextStep();
    }
  };

  const handlePrev = (e) => {
    e.preventDefault();
    prevStep();
  };

  useEffect(() => {
    // Skip processing if we're already processing or if this template was already processed
    if (isProcessingRef.current || 
        !fingerprintTemplate || 
        !formData.nationalid ||
        (processedTemplateIdRef.current === fingerprintTemplate.iso_template_id)) {
      return;
    }

    // Set processing flag to true to prevent re-entry
    isProcessingRef.current = true;
    
    try {
      setConversionLog([]);
      setCurrentStep('fingerprint');
      setLocalFingerprintError(''); // Clear any previous errors

      // Store the template ID we're processing
      processedTemplateIdRef.current = fingerprintTemplate.iso_template_id;

      // Log the final fingerprint template
      console.log('Final fingerprint template generated:', JSON.stringify(fingerprintTemplate, null, 2));
      
      // Verify that we have an ISO template from the API
      if (!fingerprintTemplate.iso_template_base64) {
        throw new Error('Missing ISO template base64 data from the API');
      }
      
      console.log('Using received base64 ISO template from API for DID generation');

      // Improved step detection with alternative pattern matching
      const originalConsoleLog = console.log;
      console.log = (message) => {
        originalConsoleLog(message);
        if (typeof message === 'string') {
          // Enhanced pattern matching for step detection
          if (message.includes("STEP 1") || message.includes("Extracting standardized ISO template")) {
            setCurrentStep('template');
            setConversionLog(prevLogs => [...prevLogs, "STEP 1: Extracting ISO template"]);
          }
          else if (message.includes("STEP 2") || message.includes("Generating stable secret key")) {
            setCurrentStep('secretKey');
            setConversionLog(prevLogs => [...prevLogs, "STEP 2: Generating stable secret key"]);
          }
          else if (message.includes("STEP 3") || message.includes("hash") || message.includes("SHA-256")) {
            setCurrentStep('hash');
            setConversionLog(prevLogs => [...prevLogs, "STEP 3: Creating cryptographic hash"]);
          }
          else if (message.includes("STEP 4") || message.includes("Deriving") || message.includes("key pair")) {
            setCurrentStep('keyPair');
            setConversionLog(prevLogs => [...prevLogs, "STEP 4: Generating cryptographic keypair"]);
          }
          else if (message.includes("STEP 6") || message.includes("DID:key") || message.includes("Generating DID")) {
            setCurrentStep('did');
            setConversionLog(prevLogs => [...prevLogs, "STEP 6: Creating DID from public key"]);
          }
          else if (message.includes("Starting biometric") || message.includes("✅") || message.includes("completed successfully")) {
            setConversionLog(prevLogs => [...prevLogs, message]);
          }
        }
      };

      // Force a small delay to ensure UI can show the initial step before proceeding
      setTimeout(() => {
        try {
          const result = biometricToDID(fingerprintTemplate, formData.nationalid, true); // Pass true to indicate this is a key person
          setDidResult(result);
          
          // Force the last step to be marked as complete
          setCurrentStep('did');
          
          if (onEnrollmentComplete) {
            // Pass both template and DID information to parent - only call this once
            onEnrollmentComplete({
              template: fingerprintTemplate,
              did: result.didKey,
              privateKey: result.privateKey,
              publicKey: result.publicKey
            });
          }
        } catch (error) {
          console.error('Error during biometric to DID conversion:', error);
          setConversionLog(prevLogs => [...prevLogs, `Error: ${error.message}`]);
          setLocalFingerprintError(`Error during biometric to DID conversion: ${error.message}`);
        } finally {
          // Restore original console.log
          console.log = originalConsoleLog;
          // Reset the processing flag when done
          isProcessingRef.current = false;
        }
      }, 100);
    } catch (error) {
      console.error('Error during biometric to DID conversion:', error);
      setConversionLog(prevLogs => [...prevLogs, `Error: ${error.message}`]);
      setLocalFingerprintError(`Error during biometric to DID conversion: ${error.message}`);
      // Reset the processing flag on error
      isProcessingRef.current = false;
    }
  }, [fingerprintTemplate, formData.nationalid, onEnrollmentComplete]);

  const handleBiometricCaptured = (templateData) => {
    // Process fingerprint templates and generate DID
    console.log('Biometric data captured, setting template data');
    setFingerprintTemplate(templateData);
    
    // If there's an onEnrollmentComplete callback, pass the template data
    if (onEnrollmentComplete) {
      onEnrollmentComplete(templateData);
    }
  };
  
  const getStepColorClass = (stepId) => {
    if (!currentStep) return 'bg-gray-200 text-gray-500';
    if (stepId === currentStep) return 'bg-blue-500 text-white';
    if (currentStep === 'did' || 
        (workflowSteps.findIndex(s => s.id === stepId) < workflowSteps.findIndex(s => s.id === currentStep))) {
      return 'bg-green-500 text-white';
    }
    return 'bg-gray-200 text-gray-500';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {showSuccessMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto transform transition-all animate-bounce-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Registration {isEditMode ? 'Updated' : 'Completed'} Successfully!</h3>
              <p className="mt-2 text-sm text-gray-600">
                {isEditMode 
                  ? 'The keyperson record has been updated with the new information and blockchain identity.' 
                  : 'The keyperson has been registered successfully with blockchain identity.'}
              </p>
              
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Keyperson Information</h4>
                
                <div className="space-y-3">
                  {/* National ID */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500">NATIONAL ID</label>
                    <div className="font-mono text-sm bg-white p-2 rounded border border-gray-200 mt-1">
                      {formData.nationalid}
                    </div>
                  </div>
                  
                  {/* DID:key */}
                  {didResult && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500">DECENTRALIZED IDENTIFIER (DID)</label>
                      <div className="font-mono text-xs bg-white p-2 rounded border border-gray-200 mt-1 truncate">
                        {didResult.didKey}
                      </div>
                    </div>
                  )}
                  
                  {/* Blockchain Address */}
                  {blockchainAddress && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500">BLOCKCHAIN ADDRESS</label>
                      <div className="font-mono text-xs bg-white p-2 rounded border border-gray-200 mt-1 truncate">
                        {blockchainAddress}
                      </div>
                    </div>
                  )}
                  
                  {/* Transaction Info */}
                  {blockchainTxInfo && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500">TRANSACTION HASH</label>
                      <div className="font-mono text-xs bg-white p-2 rounded border border-gray-200 mt-1 truncate">
                        {blockchainTxInfo.transactionHash}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="mt-4 px-4 py-2 bg-kweli-primary text-white rounded-md hover:bg-kweli-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 bg-gradient-to-r from-gray-50 to-kweli-light border border-gray-100 rounded-lg shadow-soft-sm">
        {/* Show success message if available */}
        {(showLocalSuccess || (successMessage && showSuccess)) && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-soft-sm animate-fade-in">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage || localSuccessMessage || 'Operation successful!'}</span>
            </div>
          </div>
        )}
        
        {/* Show error message if available */}
        {(localError || error || localFingerprintError) && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-soft-sm animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error || localError || localFingerprintError}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
            <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-kweli-dark">Biometric Data Collection</h3>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          {isEditMode 
            ? 'Update biometric data if needed or skip this step to keep existing biometric data.' 
            : 'Please use the fingerprint reader to collect biometric data for keyperson registration.'}
        </p>
        
        {/* Fingerprint enrollment section */}
        <div className="mb-6">
          <BiometricInput 
            nationalId={formData.nationalid} 
            onBiometricCaptured={handleBiometricCaptured}
          />
        </div>
        
        {/* DID workflow visualization if fingerprint template exists */}
        {fingerprintTemplate && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-indigo-800">Fingerprint to Blockchain Identity Conversion</h4>
              <button 
                type="button" 
                onClick={() => setShowConversionDetails(!showConversionDetails)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
              >
                {showConversionDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="mb-6">
              <div className="hidden sm:block">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${currentStep ? 'bg-gray-200' : 'bg-gray-100'}`}></div>
                  </div>
                  
                  <div className="relative flex justify-between">
                    {workflowSteps.map((step, idx) => (
                      <div key={step.id} className="flex flex-col items-center">
                        <div className={`h-8 w-8 flex items-center justify-center rounded-full ${getStepColorClass(step.id)} transition-colors duration-200 shadow-md`}>
                          {(currentStep === 'did' || 
                            (workflowSteps.findIndex(s => s.id === step.id) < workflowSteps.findIndex(s => s.id === currentStep))) 
                            ? (
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-xs">{idx + 1}</span>
                            )}
                        </div>
                        <div className={`mt-2 text-xs font-medium ${
                          step.id === currentStep ? 'text-blue-600' : 
                          currentStep === 'did' || (workflowSteps.findIndex(s => s.id === step.id) < workflowSteps.findIndex(s => s.id === currentStep)) 
                            ? 'text-green-600' 
                            : 'text-gray-500'
                        }`}>
                          {step.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="sm:hidden">
                <div className="space-y-2">
                  {workflowSteps.map((step, idx) => (
                    <div 
                      key={step.id}
                      className={`flex items-center p-2 rounded-md ${
                        step.id === currentStep ? 'bg-blue-100 border-l-4 border-blue-500' : 
                        currentStep === 'did' || (workflowSteps.findIndex(s => s.id === step.id) < workflowSteps.findIndex(s => s.id === currentStep))
                          ? 'bg-green-50 border-l-4 border-green-500' 
                          : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className={`h-6 w-6 flex items-center justify-center rounded-full mr-2 ${getStepColorClass(step.id)} text-xs`}>
                        {(currentStep === 'did' || 
                          (workflowSteps.findIndex(s => s.id === step.id) < workflowSteps.findIndex(s => s.id === currentStep))) 
                          ? (
                            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                      </div>
                      <span 
                        className={`text-sm font-medium ${
                          step.id === currentStep ? 'text-blue-700' : 
                          currentStep === 'did' || (workflowSteps.findIndex(s => s.id === step.id) < workflowSteps.findIndex(s => s.id === currentStep))
                            ? 'text-green-700' 
                            : 'text-gray-600'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {showConversionDetails && (
              <div className="bg-white rounded border border-gray-200 p-3 mb-4 text-xs font-mono h-40 overflow-y-auto">
                {conversionLog.map((log, index) => (
                  <div key={index} className="pb-1">{log}</div>
                ))}
              </div>
            )}
            
            {didResult && (
              <div className="bg-white rounded-lg p-4 border border-blue-200 mt-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="flex items-center mb-1">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-gray-800">Blockchain Identity Generated Successfully!</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">DECENTRALIZED IDENTIFIER (DID)</span>
                    <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 truncate">
                      {didResult.didKey}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      This DID will be stored with your keyperson record. You can now proceed to complete your registration.
                    </p>
                  </div>
                  
                  {showConversionDetails && (
                    <>
                      <div>
                        <span className="text-xs font-medium text-gray-500">PUBLIC KEY (HEX)</span>
                        <div className="font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 truncate">
                          {didResult.publicKey}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-red-500 flex items-center">
                          <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          PRIVATE KEY (SECURE)
                        </span>
                        <div className="font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 truncate">
                          {didResult.privateKey}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {isEditMode && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Note:</span> Updating biometrics will replace any existing biometric data for this keyperson. If you don't upload new biometrics, existing data will be preserved.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-5 flex justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center text-gray-700 font-medium py-2.5 px-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || isSavingToBlockchain}
          className={`flex items-center bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2.5 px-6 rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-300 transform hover:-translate-y-0.5 ${
            (isSubmitting || isSavingToBlockchain) ? 'opacity-80' : ''
          }`}
        >
          {isSubmitting || isSavingToBlockchain ? (
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isSubmitting ? 'Processing...' : 'Saving to Blockchain...'}
            </div>
          ) : (
            <>
              {isEditMode || isObserver ? (didResult ? 'Save Registration with Blockchain Identity' : 'Submit') : 'Next'}
              {(isEditMode || isObserver) && (
                <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default KeypersonStep2;