import React from 'react';

const VoterStep1 = ({ formData, handleInputChange, nextStep, isEditMode }) => {
  const handleNext = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="nationalid" className="block text-sm font-medium text-gray-700">National ID *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="nationalid"
              name="nationalid"
              value={formData.nationalid}
              onChange={handleInputChange}
              required
              placeholder="Enter National ID"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
              readOnly={isEditMode} // Make National ID read-only in edit mode
              disabled={isEditMode}
            />
            {isEditMode && (
              <div className="mt-1 text-xs text-gray-500">
                National ID cannot be changed
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              required
              placeholder="Enter First Name"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="middlename" className="block text-sm font-medium text-gray-700">Middle Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="middlename"
              name="middlename"
              value={formData.middlename}
              onChange={handleInputChange}
              placeholder="Enter Middle Name (Optional)"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Surname *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              required
              placeholder="Enter Surname"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="designatedPollingStation" className="block text-sm font-medium text-gray-700">Designated Polling Station *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="designatedPollingStation"
              name="designatedPollingStation"
              value={formData.designatedPollingStation}
              onChange={handleInputChange}
              required
              placeholder="Enter Polling Station"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-6 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2.5 px-6 rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span>Next Step</span>
          <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VoterStep1;