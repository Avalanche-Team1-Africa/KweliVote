import React, { useState, useEffect } from 'react';
import FingerprintEnrollment from './FingerprintEnrollment';
import biometricToDID from '../../utils/biometricToDID';

const VoterStep2 = ({ formData, prevStep, handleSubmit, isSubmitting = false, onEnrollmentComplete, onDIDGenerated, isEditMode }) => {
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [didResult, setDidResult] = useState(null);
  const [conversionLog, setConversionLog] = useState([]);
  const [showConversionDetails, setShowConversionDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [localFingerprintError, setLocalFingerprintError] = useState('');

  const workflowSteps = [
    { id: 'fingerprint', label: 'Fingerprint' },
    { id: 'template', label: 'Template' },
    { id: 'stabilization', label: 'Stabilization' },
    { id: 'secretKey', label: 'Secret Key' },
    { id: 'hash', label: 'Hash' },
    { id: 'keyPair', label: 'Key Pair' },
    { id: 'did', label: 'DID:key' }
  ];

  const handlePrev = (e) => {
    e.preventDefault();
    prevStep();
  };

  useEffect(() => {
    if (fingerprintTemplate && formData.nationalid) {
      try {
        setConversionLog([]);
        setCurrentStep('fingerprint');
        setLocalFingerprintError(''); // Clear any previous errors

        const originalConsoleLog = console.log;
        console.log = (message) => {
          originalConsoleLog(message);
          if (typeof message === 'string') {
            if (message.includes("STEP 1")) setCurrentStep('template');
            else if (message.includes("STEP 2")) setCurrentStep('stabilization');
            else if (message.includes("STEP 3")) setCurrentStep('secretKey');
            else if (message.includes("STEP 4")) setCurrentStep('hash');
            else if (message.includes("STEP 5")) setCurrentStep('keyPair');
            else if (message.includes("STEP 7")) setCurrentStep('did');

            setConversionLog(prevLogs => [...prevLogs, message]);
          }
        };

        const result = biometricToDID(fingerprintTemplate, formData.nationalid);
        setDidResult(result);

        if (onDIDGenerated) {
          onDIDGenerated(result);
        }

        console.log = originalConsoleLog;
      } catch (error) {
        console.error('Error during biometric to DID conversion:', error);
        setConversionLog(prevLogs => [...prevLogs, `Error: ${error.message}`]);
        setLocalFingerprintError(`Error during biometric to DID conversion: ${error.message}`);
      }
    }
  }, [fingerprintTemplate, formData.nationalid, onDIDGenerated]);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (didResult) {
      console.log('Submitting with DID:', didResult.didKey);
      console.log('Private key (should be securely stored):', didResult.privateKey);
      console.log('Public key:', didResult.publicKey);
    }

    setShowSuccessMessage(true);

    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);

    handleSubmit(e);
  };

  const handleEnrollmentComplete = (templateData) => {
    setFingerprintTemplate(templateData);
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
                  ? 'The voter record has been updated with the new information.' 
                  : 'The voter has been registered successfully with a blockchain identity.'}
              </p>
              {didResult && (
                <div className="mt-3 inline-block bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
                  <span className="block text-xs text-gray-500 mb-1">BLOCKCHAIN IDENTITY (DID)</span>
                  <span className="font-mono text-xs text-gray-800 truncate max-w-full block">{didResult.didKey}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-5 bg-gradient-to-r from-gray-50 to-kweli-light border border-gray-100 rounded-lg shadow-soft-sm">
        {localFingerprintError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-soft-sm animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{localFingerprintError}</span>
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
        
        <p className="text-gray-600 mb-4 text-sm">
          {isEditMode 
            ? 'Update biometric data if needed or skip this step to keep existing biometric data.' 
            : 'Please use the fingerprint reader to collect biometric data for voter registration.'}
        </p>
        
        <FingerprintEnrollment 
          nationalId={formData.nationalid} 
          onEnrollmentComplete={handleEnrollmentComplete}
          requiredScans={5}
        />
        
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
                      This DID will be stored with your voter record. You can now submit to complete your registration.
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
                <span className="font-medium">Note:</span> Updating biometrics will replace any existing biometric data for this voter. If you don't upload new biometrics, existing data will be preserved.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-5 flex justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isSubmitting}
          className="flex items-center text-gray-700 font-medium py-2.5 px-6 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        
        <button
          type="button"
          onClick={handleFormSubmit}
          disabled={isSubmitting}
          className={`flex items-center bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2.5 px-6 rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-300 transform hover:-translate-y-0.5 ${isSubmitting ? 'opacity-80' : ''}`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              {isEditMode ? 'Update Voter' : didResult ? 'Save Registration with Blockchain Identity' : 'Submit'}
              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoterStep2;