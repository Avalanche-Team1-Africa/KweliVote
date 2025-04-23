import React, { useState } from 'react';
import KeypersonStep1 from './KeypersonStep1';
import KeypersonStep2 from './KeypersonStep2';
import KeypersonStep3 from './KeypersonStep3';

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
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here would be the API call to save the keyperson
    console.log('Keyperson data submitted:', formData);
    // Reset form after submission
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
    alert('Keyperson registered successfully!');
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-kweli-dark mb-6 text-center">Register Keyperson</h2>
      
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div 
            className={`w-1/3 text-center p-2 ${currentStep === 1 
              ? 'bg-kweli-primary text-white font-bold rounded-l-lg' 
              : 'bg-gray-200'}`}
          >
            1: Personal Details
          </div>
          <div 
            className={`w-1/3 text-center p-2 ${currentStep === 2 
              ? 'bg-kweli-primary text-white font-bold' 
              : 'bg-gray-200'}`}
          >
            2: Biometric Data
          </div>
          <div 
            className={`w-1/3 text-center p-2 ${currentStep === 3 && !isObserver 
              ? 'bg-kweli-primary text-white font-bold rounded-r-lg' 
              : 'bg-gray-200'}`}
          >
            3: User Account
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
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
          />
        )}
      </form>
    </div>
  );
};

export default KeypersonRegister;