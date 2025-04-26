import React, { useState } from 'react';
import KeypersonStep1 from './KeypersonStep1';
import KeypersonStep2 from './KeypersonStep2';
import KeypersonStep3 from './KeypersonStep3';
import { keypersonAPI } from '../../utils/api';

const KeypersonRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal information (Step 1)
    nationalid: '',
    firstname: '',
    middlename: '',
    surname: '',
    role: '',
    politicalParty: '',
    designatedPollingStation: '',
    observerType: '',
    stakeholder: '',
    
    // Biometric data (Step 2)
    biometricData: null,
    biometricImage: null,
    
    // User account (Step 3)
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  // Store fingerprint template separately since it's a complex object
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [isObserver, setIsObserver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for role selection
    if (name === 'role') {
      setIsObserver(value === 'Observers');
    }
    
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
      // Validation checks before submission
      if (formData.role === 'Observers' && !formData.observerType) {
        setError('Observer type is required for Observers');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.role === 'Party Agents' && !formData.politicalParty) {
        setError('Political party is required for Party Agents');
        setIsSubmitting(false);
        return;
      }

      // Prepare data for API - combining keyperson and user data for a single transaction
      const combinedData = {
        // Keyperson data
        nationalid: formData.nationalid,
        firstname: formData.firstname,
        middlename: formData.middlename || null,
        surname: formData.surname,
        role: formData.role,
        political_party: formData.politicalParty || null,
        designated_polling_station: formData.designatedPollingStation,
        observer_type: formData.observerType || null,
        stakeholder: formData.stakeholder || null,
        did: `did:example:${formData.nationalid}`,
        created_by: 'system',
        biometric_data: null,
        biometric_image: null,
        has_template: fingerprintTemplate !== null,
        
        // User data - included in the same request for non-observers
        ...((!isObserver) && {
          username: formData.username,
          password: formData.password,
        })
      };

      // Use the new transaction-based endpoint that creates both keyperson and user atomically
      const result = await keypersonAPI.createKeypersonWithUser(combinedData);
      console.log('Registration result:', result);
      
      // Handle biometric data upload
      if (fingerprintTemplate) {
        try {
          // Save the fingerprint template to the database using our new API endpoint
          const templateResult = await keypersonAPI.saveBiometricTemplate(
            formData.nationalid, 
            fingerprintTemplate
          );
          console.log('Fingerprint template saved:', templateResult);
        } catch (bioError) {
          console.error('Error saving biometric template:', bioError);
          // Continue with success flow even if biometric save fails
        }
      } else if (formData.biometricData || formData.biometricImage) {
        // Handle file upload for traditional biometric data files
        // This would typically involve a separate API call for file upload
        console.log('Uploading biometric files for keyperson:', formData.nationalid);
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
          role: '',
          politicalParty: '',
          designatedPollingStation: '',
          observerType: '',
          stakeholder: '',
          biometricData: null,
          biometricImage: null,
          username: '',
          password: '',
          confirmPassword: '',
        });
        setFingerprintTemplate(null);
        setCurrentStep(1);
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error registering keyperson:', error);
      
      // Extract more specific error message if available from the API response
      if (error.response && error.response.data) {
        // Handle object or string error responses
        if (error.response.data.error) {
          // Direct error message
          setError(error.response.data.error);
        } else if (error.response.data.details) {
          // Detailed validation errors
          const errorDetails = error.response.data.details;
          const errorMessages = Object.entries(errorDetails)
            .map(([key, value]) => {
              // Handle both array and string error messages
              const errorValue = Array.isArray(value) ? value.join(', ') : value;
              return `${key}: ${errorValue}`;
            })
            .join('; ');
          setError(errorMessages);
        } else {
          // General case for other error formats
          const errorMessages = Object.entries(error.response.data)
            .map(([key, value]) => {
              const errorValue = Array.isArray(value) ? value.join(', ') : value;
              return `${key}: ${errorValue}`;
            })
            .join('; ');
          setError(errorMessages || 'Failed to register keyperson. Please try again.');
        }
      } else {
        // For network errors or other non-API errors
        setError(error.message || 'Failed to register keyperson. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const steps = [
    { number: 1, name: 'Personal Details', status: currentStep >= 1 ? 'active' : 'inactive' },
    { number: 2, name: 'Biometric Data', status: currentStep >= 2 ? 'active' : 'inactive' },
    { number: 3, name: 'User Account', status: currentStep === 3 ? 'active' : 'inactive', hidden: isObserver }
  ].filter(step => !step.hidden);
  
  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">Register Keyperson</h2>
          <p className="text-gray-600">Complete the form to register a new keyperson</p>
        </div>
        
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-soft-sm animate-fade-in">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Keyperson registered successfully!</span>
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
              {steps.map((step, idx) => (
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
            <KeypersonStep1
              formData={formData}
              handleInputChange={handleInputChange}
              nextStep={nextStep}
              setIsObserver={setIsObserver}
            />
          )}
          
          {currentStep === 2 && (
            <KeypersonStep2
              formData={formData}
              handleInputChange={handleInputChange}
              handleFileChange={handleFileChange}
              nextStep={nextStep}
              prevStep={prevStep}
              isObserver={isObserver}
              onEnrollmentComplete={handleFingerprintEnrollment}
            />
          )}
          
          {currentStep === 3 && !isObserver && (
            <KeypersonStep3
              formData={formData}
              handleInputChange={handleInputChange}
              prevStep={prevStep}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default KeypersonRegister;