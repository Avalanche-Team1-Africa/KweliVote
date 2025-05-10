import React, { useState, useEffect, useRef } from 'react';
import FingerprintEnrollment from '../voter/FingerprintEnrollment'; // Reuse the voter component
import biometricToDID from '../../utils/biometricToDID';
import apiServices from '../../utils/api';

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
  
  // Add a processing flag ref to prevent multiple executions
  const isProcessingRef = useRef(false);
  // Add template ID tracking to avoid reprocessing the same template
  const processedTemplateIdRef = useRef(null);

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

  const handleEnrollmentComplete = (templateData) => {
    // Process fingerprint templates and generate DID
    console.log('Biometric enrollment completed, setting template data');
    setFingerprintTemplate(templateData);
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
        
        {/* Fingerprint reader is now the only option */}
        <FingerprintEnrollment 
          nationalId={formData.nationalid} 
          onEnrollmentComplete={handleEnrollmentComplete}
          requiredScans={5}
        />
        
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
          disabled={isSubmitting}
          className={`flex items-center bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2.5 px-6 rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-300 transform hover:-translate-y-0.5 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            isEditMode || isObserver ? 'Submit' : 'Next'
          )}
        </button>
      </div>
    </div>
  );
};

export default KeypersonStep2;