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
      // Prepare keyperson data for API
      const keypersonData = {
        national_id: formData.nationalid,
        first_name: formData.firstname,
        middle_name: formData.middlename,
        surname: formData.surname,
        role: formData.role,
        political_party: formData.politicalParty || null,
        designated_polling_station: formData.designatedPollingStation,
        observer_type: formData.observerType || null,
        stakeholder: formData.stakeholder || null
      };

      // First create the keyperson
      const createdKeyperson = await keypersonAPI.createKeyperson(keypersonData);
      console.log('Keyperson created:', createdKeyperson);

      // If this is not an observer and we need to create a user account
      if (!isObserver && formData.username && formData.password) {
        // Create user account linked to the keyperson
        const userData = {
          username: formData.username,
          password: formData.password,
          national_id: formData.nationalid, // Link to the keyperson by national ID
          role: formData.role
        };
        
        await keypersonAPI.createKeypersonUser(userData);
        console.log('User account created for keyperson');
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
        setCurrentStep(1);
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error registering keyperson:', error);
      setError(error.message || 'Failed to register keyperson. Please try again.');
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