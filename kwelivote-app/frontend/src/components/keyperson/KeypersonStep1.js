import React from 'react';

const KeypersonStep1 = ({ formData, handleInputChange, nextStep, setIsObserver }) => {
  const handleNext = (e) => {
    e.preventDefault();
    nextStep();
  };
  
  const handleRoleChange = (e) => {
    const { value } = e.target;
    setIsObserver(value === 'Observers');
    handleInputChange(e);
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
        
        <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role *</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleRoleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          >
            <option value="" disabled>Select a role</option>
            <option value="Party Agents">Party Agent</option>
            <option value="Registration Clerk">Registration Clerk</option>
            <option value="Presiding Officer (PO)">Presiding Officer (PO)</option>
            <option value="Deputy Presiding Officer (DPO)">Deputy Presiding Officer (DPO)</option>
            <option value="Polling Clerks">Polling Clerk</option>
            <option value="Observers">Observer</option>
          </select>
        </div>
        
        <div className="space-y-2">
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

      {formData.role === 'Party Agents' && (
        <div className="space-y-2">
          <label htmlFor="politicalParty" className="block text-sm font-medium text-gray-700">Political Party *</label>
          <input
            type="text"
            id="politicalParty"
            name="politicalParty"
            value={formData.politicalParty}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
      )}

      {formData.role === 'Observers' && (
        <>
          <div className="space-y-2">
            <label htmlFor="observerType" className="block text-sm font-medium text-gray-700">Observer Type *</label>
            <select
              id="observerType"
              name="observerType"
              value={formData.observerType}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
            >
              <option value="" disabled>Select observer type</option>
              <option value="local">Local</option>
              <option value="international">International</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="stakeholder" className="block text-sm font-medium text-gray-700">Stakeholder *</label>
            <input
              type="text"
              id="stakeholder"
              name="stakeholder"
              value={formData.stakeholder}
              onChange={handleInputChange}
              required
              placeholder="Organization name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
            />
          </div>
        </>
      )}
      
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

export default KeypersonStep1;