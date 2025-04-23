import React, { useState } from 'react';
import VoterStep1 from './VoterStep1';
import VoterStep2 from './VoterStep2';

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
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here would be the API call to save the voter
    console.log('Voter data submitted:', formData);
    // Reset form after submission
    setFormData({
      nationalid: '',
      firstname: '',
      middlename: '',
      surname: '',
      designatedPollingStation: '',
      biometricData: null,
      biometricImage: null,
    });
    setCurrentStep(1);
    alert('Voter registered successfully!');
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-kweli-dark mb-6 text-center">Register Voter</h2>
      
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div 
            className={`w-1/2 text-center p-2 ${currentStep === 1 
              ? 'bg-kweli-primary text-white font-bold rounded-l-lg' 
              : 'bg-gray-200'}`}
          >
            1: Personal Details
          </div>
          <div 
            className={`w-1/2 text-center p-2 ${currentStep === 2 
              ? 'bg-kweli-primary text-white font-bold rounded-r-lg' 
              : 'bg-gray-200'}`}
          >
            2: Biometric Data
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
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
          />
        )}
      </form>
    </div>
  );
};

export default VoterRegister;