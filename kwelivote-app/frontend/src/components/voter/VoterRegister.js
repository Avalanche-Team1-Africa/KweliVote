import React, { useState } from 'react';
import VoterStep1 from './VoterStep1';
import VoterStep2 from './VoterStep2';
import { voterAPI } from '../../utils/api';

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
  
  // Store fingerprint template separately since it's a complex object
  const [fingerprintTemplate, setFingerprintTemplate] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 
  
  // Search-related states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVoterId, setEditingVoterId] = useState(null);
  
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
  
  const handleFingerprintEnrollment = (templateData) => {
    setFingerprintTemplate(templateData);
  };
  
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsSearching(true);
    setError('');
    
    try {
      const results = await voterAPI.searchVoters(searchTerm);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching voters:', error);
      setError(error.message || 'Failed to search voters. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };
  
  const selectVoterToEdit = async (voter) => {
    try {
      // Load voter details
      const voterDetails = await voterAPI.getVoterById(voter.nationalid);
      
      // Update form data with voter details
      setFormData({
        nationalid: voterDetails.nationalid || '',
        firstname: voterDetails.firstname || '',
        middlename: voterDetails.middlename || '',
        surname: voterDetails.surname || '',
        designatedPollingStation: voterDetails.designated_polling_station || '',
        biometricData: null,
        biometricImage: null,
        // Store the DID in formData so we can use it when updating
        did: voterDetails.did || '',
      });
      
      // Update state variables
      setShowSearchResults(false);
      setIsEditMode(true);
      setEditingVoterId(voter.nationalid);
      setSearchTerm('');
      
      // Reset to step 1
      setCurrentStep(1);
    } catch (error) {
      console.error('Error loading voter details:', error);
      setError(error.message || 'Failed to load voter details. Please try again.');
    }
  };
  
  const cancelEdit = () => {
    // Clear form and reset state
    setFormData({
      nationalid: '',
      firstname: '',
      middlename: '',
      surname: '',
      designatedPollingStation: '',
      biometricData: null,
      biometricImage: null,
    });
    setFingerprintTemplate(null);
    setIsEditMode(false);
    setEditingVoterId(null);
    setCurrentStep(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Get the logged-in user info
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      
      // Prepare voter data for API with correct field names matching the backend
      const voterData = {
        nationalid: formData.nationalid,
        firstname: formData.firstname,
        middlename: formData.middlename,
        surname: formData.surname,
        designated_polling_station: formData.designatedPollingStation,
        created_by: userInfo.username || 'system', // Use the logged-in username or default to 'system'
      };
      
      if (!isEditMode) {
        // For new voters, generate a DID and set has_template
        voterData.did = `did:example:${formData.nationalid}`; // Generate a basic DID based on the national ID
        voterData.has_template = fingerprintTemplate !== null;
        
        // Create the voter
        const createdVoter = await voterAPI.createVoter(voterData);
        console.log('Voter created:', createdVoter);
        
        // Handle biometric data upload for new voters
        if (fingerprintTemplate) {
          try {
            // Save the fingerprint template to the database using our API endpoint
            const templateResult = await voterAPI.saveBiometricTemplate(
              formData.nationalid, 
              fingerprintTemplate
            );
            console.log('Fingerprint template saved:', templateResult);
          } catch (bioError) {
            console.error('Error saving biometric template:', bioError);
            // Continue with success flow even if biometric save fails
          }
        }
        
        setSuccessMessage('Voter registered successfully!');
      } else {
        // For existing voters, update the record
        // IMPORTANT: Include DID when updating - it's a required field
        voterData.did = formData.did || `did:example:${formData.nationalid}`;
        
        const updatedVoter = await voterAPI.updateVoter(editingVoterId, voterData);
        console.log('Voter updated:', updatedVoter);
        
        // Handle biometric data for updates if provided
        if (fingerprintTemplate) {
          try {
            const templateResult = await voterAPI.saveBiometricTemplate(
              editingVoterId,
              fingerprintTemplate
            );
            console.log('Fingerprint template updated:', templateResult);
          } catch (bioError) {
            console.error('Error updating biometric template:', bioError);
          }
        }
        
        setSuccessMessage('Voter updated successfully!');
        
        // Reset edit mode after successful update
        setIsEditMode(false);
        setEditingVoterId(null);
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
          designatedPollingStation: '',
          biometricData: null,
          biometricImage: null,
        });
        setFingerprintTemplate(null);
        setCurrentStep(1);
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(isEditMode ? 'Error updating voter:' : 'Error registering voter:', error);
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'register'} voter. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const steps = [
    { number: 1, name: 'Personal Details', status: currentStep >= 1 ? 'active' : 'inactive' },
    { number: 2, name: 'Biometric Data', status: currentStep >= 2 ? 'active' : 'inactive' },
  ];
  
  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">
            {isEditMode ? 'Update Voter' : 'Register Voter'}
          </h2>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update the voter information in the system' 
              : 'Complete the form to register a new voter in the system'}
          </p>
        </div>
        
        {/* Search section */}
        {!isEditMode && (
          <div className="mb-8 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <svg className="h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">Search Existing Voters</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Name or National ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  {isSearching ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : 'Search'}
                </button>
                {showSearchResults && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {/* Search results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            National ID
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Polling Station
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {searchResults.map((voter) => (
                          <tr key={voter.nationalid} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {voter.nationalid}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {`${voter.firstname} ${voter.middlename || ''} ${voter.surname}`}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {voter.designated_polling_station}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                              <button
                                type="button"
                                onClick={() => selectVoterToEdit(voter)}
                                className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-kweli-primary hover:bg-kweli-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary/50"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {showSearchResults && searchResults.length === 0 && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-700">No voters found matching your search criteria</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-soft-sm animate-fade-in">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
              {fingerprintTemplate && <span className="ml-1">Biometric enrollment completed.</span>}
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
        
        {/* Edit mode indicator */}
        {isEditMode && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-md shadow-soft-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Editing Voter: <strong>{formData.firstname} {formData.surname}</strong> (ID: {editingVoterId})</span>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md"
              >
                Cancel Edit
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="h-1 w-full bg-gray-200 rounded"></div>
            </div>
            <div className="relative flex justify-between">
              {steps.map((step) => (
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
            <VoterStep1
              formData={formData}
              handleInputChange={handleInputChange}
              nextStep={nextStep}
              isEditMode={isEditMode}
            />
          )}
          
          {currentStep === 2 && (
            <VoterStep2
              formData={formData}
              handleFileChange={handleFileChange}
              prevStep={prevStep}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onEnrollmentComplete={handleFingerprintEnrollment}
              isEditMode={isEditMode}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default VoterRegister;