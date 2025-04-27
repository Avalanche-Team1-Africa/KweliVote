import React, { useState, useEffect } from 'react';
import VoterStep1 from './VoterStep1';
import VoterStep2 from './VoterStep2';
import { voterAPI } from '../../utils/api';
import blockchainService from '../../services/BlockchainService';

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
  // Store generated DID information
  const [didInfo, setDidInfo] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [blockchainStatus, setBlockchainStatus] = useState({
    initialized: false,
    message: 'Not connected to blockchain'
  });
  
  // Search-related states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVoterId, setEditingVoterId] = useState(null);
  
  // Initialize blockchain service when component mounts
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        const isInitialized = await blockchainService.initialize();
        setBlockchainStatus({
          initialized: isInitialized,
          message: isInitialized 
            ? 'Connected to Avalanche blockchain' 
            : 'Blockchain not configured. Admin setup required.'
        });
      } catch (err) {
        console.error('Failed to initialize blockchain service:', err);
        setBlockchainStatus({
          initialized: false,
          message: `Blockchain initialization error: ${err.message}`
        });
      }
    };
    
    initBlockchain();
  }, []);

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
  
  const handleFingerprintEnrollment = (templateData, didResult = null) => {
    setFingerprintTemplate(templateData);
    
    // Store DID information if provided (from biometric-to-DID conversion)
    if (didResult) {
      setDidInfo(didResult);
    }
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
    setDidInfo(null);
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
      
      // Track blockchain transaction status
      let blockchainTxHash = null;
      let voterDID = '';
      
      if (!isEditMode) {
        // For new voters, use the DID generated from the biometric data if available
        if (didInfo && didInfo.didKey) {
          console.log('Using biometrically-generated DID:', didInfo.didKey);
          voterData.did = didInfo.didKey;
          voterDID = didInfo.didKey;
          
          // Optionally store the public key in a safe place - production systems would use a secure key management service
          console.log('Public key:', didInfo.publicKey);
          
          // IMPORTANT: In a production system, the private key would be managed differently
          // For demonstration purposes only, we're logging it here
          console.log('SECURE INFO - Private key (should be stored securely):', didInfo.privateKey);
          
          // Store DID on Avalanche blockchain if service is initialized
          if (blockchainStatus.initialized) {
            try {
              console.log('Storing voter DID on Avalanche blockchain...');
              const blockchainResult = await blockchainService.registerVoterDID(
                didInfo.didKey, 
                formData.nationalid
              );
              
              if (blockchainResult.success) {
                console.log('DID registered on blockchain successfully!');
                blockchainTxHash = blockchainResult.transactionHash;
                
                // Add blockchain transaction ID to voter data
                voterData.blockchain_tx_id = blockchainTxHash;
              } else {
                console.error('Failed to register DID on blockchain:', blockchainResult.error);
              }
            } catch (blockchainError) {
              console.error('Blockchain error:', blockchainError);
              // Continue with database registration even if blockchain fails
            }
          } else {
            console.log('Blockchain not initialized. DID will only be stored in database.');
          }
        } else {
          // Fallback to a basic DID if no biometric-based DID is available
          voterData.did = `did:example:${formData.nationalid}`;
          voterDID = voterData.did;
          console.log('Using fallback DID:', voterData.did);
        }
        
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
        
        setSuccessMessage(
          blockchainTxHash 
            ? `Voter registered successfully! DID stored on Avalanche blockchain (tx: ${blockchainTxHash.substring(0, 10)}...)`
            : 'Voter registered successfully with blockchain identity!'
        );
      } else {
        // For existing voters, update the record
        // If we have a new biometrically generated DID, use it to update
        if (didInfo && didInfo.didKey) {
          voterData.did = didInfo.didKey;
          voterDID = didInfo.didKey;
          console.log('Updating with new biometrically-generated DID:', didInfo.didKey);
          
          // Update DID on blockchain if service is initialized
          if (blockchainStatus.initialized) {
            try {
              console.log('Updating voter DID on Avalanche blockchain...');
              const blockchainResult = await blockchainService.registerVoterDID(
                didInfo.didKey, 
                formData.nationalid
              );
              
              if (blockchainResult.success) {
                console.log('DID updated on blockchain successfully!');
                blockchainTxHash = blockchainResult.transactionHash;
                
                // Add blockchain transaction ID to voter data
                voterData.blockchain_tx_id = blockchainTxHash;
              } else {
                console.error('Failed to update DID on blockchain:', blockchainResult.error);
              }
            } catch (blockchainError) {
              console.error('Blockchain error:', blockchainError);
              // Continue with database update even if blockchain fails
            }
          }
        } else {
          // Otherwise keep the existing DID or use a fallback
          voterData.did = formData.did || `did:example:${formData.nationalid}`;
          voterDID = voterData.did;
        }
        
        const updatedVoter = await voterAPI.updateVoter(editingVoterId, voterData);
        console.log('Voter updated:', updatedVoter);
        
        // Handle biometric data for updates if provided
        if (fingerprintTemplate) {
          try {
            // If we have both fingerprint template and DID info, update all biometric and blockchain data
            if (didInfo && didInfo.didKey) {
              const biometricDidResult = await voterAPI.updateVoterBiometricAndDID(
                editingVoterId,
                {
                  biometric_image: formData.biometricImage, 
                  biometric_template: fingerprintTemplate,
                  did: didInfo.didKey,
                  privateKey: didInfo.privateKey,
                  publicKey: didInfo.publicKey,
                  blockchain_tx_id: blockchainTxHash
                }
              );
              console.log('All biometric and blockchain data updated:', biometricDidResult);
            } else {
              // Fall back to just updating the template if no DID info is available
              const templateResult = await voterAPI.saveBiometricTemplate(
                editingVoterId,
                fingerprintTemplate
              );
              console.log('Fingerprint template updated:', templateResult);
            }
          } catch (bioError) {
            console.error('Error updating biometric data:', bioError);
          }
        }
        
        setSuccessMessage(
          blockchainTxHash 
            ? `Voter updated successfully! DID updated on Avalanche blockchain (tx: ${blockchainTxHash.substring(0, 10)}...)`
            : 'Voter updated successfully with blockchain identity!'
        );
        
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
        setDidInfo(null);
        setCurrentStep(1);
        setShowSuccess(false);
      }, 5000);
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
        
        {/* Form steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            {steps.map((step) => (
              <div key={step.number} className={`flex-1 text-center ${step.status === 'active' ? 'text-kweli-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 ${step.status === 'active' ? 'border-kweli-primary' : 'border-gray-300'}`}>
                  {step.number}
                </div>
                <p className="mt-2 text-sm">{step.name}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Step content */}
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
            handleFingerprintEnrollment={handleFingerprintEnrollment}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        
        {/* Error message */}
        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {showSuccess && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterRegister;