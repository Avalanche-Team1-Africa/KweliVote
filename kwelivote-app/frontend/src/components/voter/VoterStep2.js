import React from 'react';

const VoterStep2 = ({ formData, handleFileChange, prevStep, handleSubmit }) => {
  const handlePrev = (e) => {
    e.preventDefault();
    prevStep();
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 italic">
        Note: Biometric data is optional and can be left blank.
      </p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="biometricImage" className="block text-sm font-medium text-gray-700">
            Fingerprint Image (optional)
          </label>
          <input
            type="file"
            id="biometricImage"
            name="biometricImage"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
          {formData.biometricImage && (
            <div className="mt-2">
              <p className="text-sm text-green-600">File selected: {formData.biometricImage.name}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="biometricData" className="block text-sm font-medium text-gray-700">
            Other Biometric Data File (optional)
          </label>
          <input
            type="file"
            id="biometricData"
            name="biometricData"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
          {formData.biometricData && (
            <div className="mt-2">
              <p className="text-sm text-green-600">File selected: {formData.biometricData.name}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-5 flex justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-md shadow transition-colors duration-200"
        >
          Back
        </button>
        
        <button
          type="submit"
          className="bg-kweli-primary hover:bg-kweli-secondary text-white font-bold py-2 px-6 rounded-md shadow transition-colors duration-200"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default VoterStep2;