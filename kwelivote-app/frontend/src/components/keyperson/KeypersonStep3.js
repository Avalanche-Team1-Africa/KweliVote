import React from 'react';

const KeypersonStep3 = ({ formData, handleInputChange, prevStep, handleSubmit, isSubmitting = false }) => {
  const handlePrev = (e) => {
    e.preventDefault();
    prevStep();
  };

  return (
    <div className="space-y-6">
      <p className="font-medium text-lg text-kweli-dark">Create User Account</p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
          {formData.password && formData.confirmPassword && 
           formData.password !== formData.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
          )}
        </div>
      </div>
      
      <div className="pt-5 flex justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-md shadow transition-colors duration-200"
          disabled={isSubmitting}
        >
          Back
        </button>
        
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={formData.password !== formData.confirmPassword || isSubmitting}
          className={`${
            formData.password === formData.confirmPassword && !isSubmitting
              ? 'bg-kweli-primary hover:bg-kweli-secondary' 
              : 'bg-gray-400 cursor-not-allowed'
          } text-white font-bold py-2 px-6 rounded-md shadow transition-colors duration-200`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </div>
  );
};

export default KeypersonStep3;