import React from 'react';

const VoterStep1 = ({ formData, handleInputChange, nextStep }) => {
  const handleNext = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="nationalid" className="block text-sm font-medium text-gray-700">National ID *</label>
          <input
            type="text"
            id="nationalid"
            name="nationalid"
            value={formData.nationalid}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">First Name *</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="middlename" className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input
            type="text"
            id="middlename"
            name="middlename"
            value={formData.middlename}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Surname *</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="designatedPollingStation" className="block text-sm font-medium text-gray-700">Designated Polling Station *</label>
          <input
            type="text"
            id="designatedPollingStation"
            name="designatedPollingStation"
            value={formData.designatedPollingStation}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
      </div>
      
      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="bg-kweli-primary hover:bg-kweli-secondary text-white font-bold py-2 px-6 rounded-md shadow transition-colors duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default VoterStep1;