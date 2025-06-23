import React from 'react';
import { useState } from 'react';
import WorkflowStep from './WorkflowStep';
import BiometricInput from '../shared/BiometricInput';

const KeyPersonStep2 = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [error, setError] = useState('');
  
  const workflowSteps = [
    { id: 'fingerprint', label: 'Fingerprint' },
    { id: 'template', label: 'Template' },
    { id: 'secretKey', label: 'Secret Key' },
    { id: 'hash', label: 'Hash' },
    { id: 'keyPair', label: 'Key Pair' },
    { id: 'did', label: 'DID:key' }
  ];

  const handleNext = () => {
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleBiometricCaptured = (templateData) => {
    console.log('Biometric data captured:', templateData);
    setFingerprintTemplate(templateData);
    // In a real implementation, you would process the fingerprint here
    // to generate a DID and move through the workflow steps
    handleNext(); // Move to the next step in the workflow
  };

  return (
    <div>
      <h2>Key Person Workflow</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Biometric Data Collection</h3>
        
        <BiometricInput 
          nationalId="demo-id" 
          onBiometricCaptured={handleBiometricCaptured}
        />
      </div>
      
      <WorkflowStep step={workflowSteps[currentStep]} />
      <div>
        <button onClick={handleBack} disabled={currentStep === 0}>
          Back
        </button>
        <button onClick={handleNext} disabled={currentStep === workflowSteps.length - 1}>
          Next
        </button>
      </div>
    </div>
  );
};

export default KeyPersonStep2;