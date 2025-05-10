import React from 'react';
import { useState } from 'react';
import WorkflowStep from './WorkflowStep';

const KeyPersonStep2 = () => {
  const [currentStep, setCurrentStep] = useState(0);

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

  return (
    <div>
      <h2>Key Person Workflow</h2>
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