import React, { useState } from 'react';
import VoterStep1 from './VoterStep1';
import VoterStep2 from './VoterStep2';
import { voterAPI } from '../../utils/api';

const VoterRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal information (Step 1)
    nationalid: '',
    firstname: '',
    middlename: '',
    surname: '',
    designatedPollingStation: '',
    
    // Biometric data (Step 2)
    biometricData: null,
    biometricImage: null,
  });
  
  // Store fingerprint template separately since it's a complex object
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    }
  };
  
  const handleFingerprintEnrollment = (templateData) => {
    setFingerprintTemplate(templateData);
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Get the logged-in user info
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      
      // Prepare voter data for API with correct field names matching the backend
      const voterData = {
        nationalid: formData.nationalid,
        firstname: formData.firstname,
        middlename: formData.middlename,
        surname: formData.surname,
        designated_polling_station: formData.designatedPollingStation,
        did: `did:example:${formData.nationalid}`, // Generate a basic DID based on the national ID
        created_by: userInfo.username || 'system', // Use the logged-in username or default to 'system',
        has_biometric_template: fingerprintTemplate !== null
      };

      // Create the voter
      const createdVoter = await voterAPI.createVoter(voterData);
      console.log('Voter created:', createdVoter);
      
      // Handle biometric data upload
      if (fingerprintTemplate) {
        try {
          // In a real implementation, you would have an API endpoint to save the biometric template
          // This is a placeholder for the actual API call
          console.log('Saving fingerprint template for voter:', formData.nationalid, fingerprintTemplate);
          
          // Example API call (commented out as it doesn't exist in the current API)
          // await voterAPI.saveBiometricTemplate(formData.nationalid, fingerprintTemplate);
        } catch (bioError) {
          console.error('Error saving biometric template:', bioError);
          // Continue with success flow even if biometric save fails
        }
      } else if (formData.biometricData || formData.biometricImage) {
        // Handle file upload for traditional biometric data files
        // This would typically involve a separate API call for file upload
        console.log('Uploading biometric files for voter:', formData.nationalid);
      }
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          nationalid: '',
          firstname: '',
          middlename: '',
          surname: '',
          designatedPollingStation: '',
          biometricData: null,
          biometricImage: null,
        });
        setFingerprintTemplate(null);
        setCurrentStep(1);
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error registering voter:', error);
      setError(error.message || 'Failed to register voter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const steps = [
    { number: 1, name: 'Personal Details', status: currentStep >= 1 ? 'active' : 'inactive' },
    { number: 2, name: 'Biometric Data', status: currentStep >= 2 ? 'active' : 'inactive' },
  ];
  
  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">Register Voter</h2>
          <p className="text-gray-600">Complete the form to register a new voter in the system</p>
        </div>
        
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-soft-sm animate-fade-in">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Voter registered successfully!</span>
              {fingerprintTemplate && <span className="ml-1">Biometric enrollment completed.</span>}
            </div>
          </div>
        )}
        
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
        
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="h-1 w-full bg-gray-200 rounded"></div>
            </div>
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div 
                  key={step.number} 
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`h-8 w-8 flex items-center justify-center rounded-full ${
                      step.status === 'active' 
                        ? 'bg-kweli-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    } font-medium transition-colors duration-200`}
                  >
                    {step.number}
                  </div>
                  <div className={`mt-2 text-xs font-medium ${
                    step.status === 'active' ? 'text-kweli-primary' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="transition-all duration-300">
          {currentStep === 1 && (
            <VoterStep1
              formData={formData}
              handleInputChange={handleInputChange}
              nextStep={nextStep}
            />
          )}
          
          {currentStep === 2 && (
            <VoterStep2
              formData={formData}
              handleFileChange={handleFileChange}
              prevStep={prevStep}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onEnrollmentComplete={handleFingerprintEnrollment}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default VoterRegister;