import React, { useState } from 'react';
import FingerprintEnrollment from '../voter/FingerprintEnrollment'; // Reuse the voter component

const KeypersonStep2 = ({ formData, nextStep, prevStep, isObserver, onEnrollmentComplete, isEditMode, handleSubmit, error, successMessage, isSubmitting, showSuccess }) => {
  const [showLocalSuccess, setShowLocalSuccess] = useState(false);
  const [localSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [localFingerprintError, setLocalFingerprintError] = useState('');

  const handleNext = async (e) => {
    e.preventDefault();
    
    // If we're in edit mode or this is an observer, we should submit the form directly
    if (isEditMode || isObserver) {
      if (handleSubmit) {
        // Clear local states
        setLocalError('');
        setShowLocalSuccess(false);
        // Submit the form directly using the parent's handleSubmit function
        await handleSubmit(e);
        // We don't need to set local success message here as it will be handled by the parent component
      }
    } else {
      // Otherwise proceed to the next step as usual
      nextStep();
    }
  };
  
  const handlePrev = (e) => {
    e.preventDefault();
    prevStep();
  };

  const handleEnrollmentComplete = (templateData) => {
    // We no longer process fingerprint templates or DIDs
    console.log('Biometric enrollment completed - data discarded as requested');
    
    if (onEnrollmentComplete) {
      // Pass null or an empty object since we're no longer handling these fields
      onEnrollmentComplete({});
    }
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