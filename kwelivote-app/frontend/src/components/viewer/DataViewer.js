import React, { useState, useEffect } from 'react';
import { voterAPI, keypersonAPI } from '../../utils/api';
import blockchainService from '../../services/BlockchainService';

const DataViewer = () => {
  const [activeTab, setActiveTab] = useState('voters');
  const [searchTerm, setSearchTerm] = useState('');
  const [voters, setVoters] = useState([]);
  const [keypersons, setKeypersons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Add states for blockchain validation
  const [validatingVoter, setValidatingVoter] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Initialize blockchain connection when component mounts
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        const initialized = await blockchainService.initialize();
        setIsBlockchainConnected(initialized);
      } catch (err) {
        console.error('Error initializing blockchain connection:', err);
      }
    };
    
    initBlockchain();
  }, []);
  
  // Fetch data when component mounts or tab changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        if (activeTab === 'voters') {
          const votersData = await voterAPI.getVoters();
          setVoters(votersData);
        } else if (activeTab === 'keypersons') {
          const keypersonsData = await keypersonAPI.getKeypersons();
          setKeypersons(keypersonsData);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]); // Re-fetch when tab changes

  // Handle blockchain verification of voter DID
  const handleVerifyVoterDID = async (voter) => {
    if (!isBlockchainConnected) {
      setError('Blockchain is not connected. Unable to verify voter.');
      return;
    }
    
    setValidatingVoter(voter);
    setValidationResult(null);
    setIsValidating(true);
    
    try {
      const result = await blockchainService.verifyVoterDID(voter.nationalid || voter.national_id);
      setValidationResult(result);
    } catch (err) {
      console.error('Error verifying voter DID:', err);
      setError(`Failed to verify voter: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };
  
  // Clear validation states
  const handleCloseValidation = () => {
    setValidatingVoter(null);
    setValidationResult(null);
  };

  const filteredVoters = voters.filter(voter => {
    if (!voter) return false;
    const fullName = `${voter.firstname || ''} ${voter.middlename || ''} ${voter.surname || ''}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || 
      (voter.nationalid && voter.nationalid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voter.designated_polling_station && voter.designated_polling_station.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const filteredKeypersons = keypersons.filter(person => {
    if (!person) return false;
    const fullName = `${person.firstname || ''} ${person.middlename || ''} ${person.surname || ''}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || 
      (person.nationalid && person.nationalid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.designated_polling_station && person.designated_polling_station.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-6 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">View Election Data</h2>
          <p className="text-gray-600">Access and review election data securely</p>
        </div>
        
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
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex w-full md:w-auto space-x-1">
            <button
              onClick={() => setActiveTab('voters')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'voters'
                  ? 'bg-gradient-to-r from-kweli-primary to-kweli-secondary text-white font-medium shadow-soft'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } rounded-l-lg transition-all duration-200`}
            >
              <svg className={`mr-2 h-5 w-5 ${activeTab === 'voters' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Voters
            </button>
            <button
              onClick={() => setActiveTab('keypersons')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'keypersons'
                  ? 'bg-gradient-to-r from-kweli-primary to-kweli-secondary text-white font-medium shadow-soft'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } rounded-r-lg transition-all duration-200`}
            >
              <svg className={`mr-2 h-5 w-5 ${activeTab === 'keypersons' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Keypersons
            </button>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 mb-6 rounded-lg shadow-soft-inner">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kweli-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'voters' && (
                <div className="animate-fade-in">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-kweli-dark">Registered Voters</h3>
                      <p className="text-sm text-gray-600">Total: {filteredVoters.length} voters</p>
                    </div>
                  </div>
  
                  {filteredVoters.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  National ID
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  DID
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Polling Station
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredVoters.map((voter) => (
                                <tr key={voter.nationalid || voter.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                                    {voter.nationalid || voter.national_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {`${voter.firstname || voter.first_name || ''} ${(voter.middlename || voter.middle_name) ? (voter.middlename || voter.middle_name) + ' ' : ''}${voter.surname || voter.last_name || ''}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                                    {voter.did ? `${voter.did.substring(0, 12)}...` : '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                      {voter.designated_polling_station}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <button
                                      onClick={() => handleVerifyVoterDID(voter)}
                                      className="px-4 py-2 text-xs font-medium text-white bg-kweli-primary rounded-lg shadow-soft hover:bg-kweli-secondary transition-all duration-200"
                                    >
                                      Validate
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg shadow-soft-inner">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-700">No voters found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'keypersons' && (
                <div className="animate-fade-in">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-kweli-dark">Election Officials & Observers</h3>
                      <p className="text-sm text-gray-600">Total: {filteredKeypersons.length} keypersons</p>
                    </div>
                  </div>
                  
                  {filteredKeypersons.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  National ID
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Role
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Polling Station
                                </th>
                                <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Party / Organization
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredKeypersons.map((person) => (
                                <tr key={person.nationalid || person.national_id || person.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                                    {person.nationalid || person.national_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {`${person.firstname || person.first_name || ''} ${(person.middlename || person.middle_name) ? (person.middlename || person.middle_name) + ' ' : ''}${person.surname || person.last_name || ''}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <RoleBadge role={person.role} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                      {person.designated_polling_station}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {person.political_party || person.stakeholder || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-lg shadow-soft-inner">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-700">No keypersons found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {validatingVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-kweli-dark mb-4">Blockchain DID Validation</h3>
            {isValidating ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kweli-primary mb-4"></div>
                <p className="text-sm text-gray-600">Validating voter identity on blockchain...</p>
              </div>
            ) : validationResult ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-800">Validation Status:</h4>
                    {validationResult.isVerified ? (
                      <div className="flex items-center text-green-600">
                        <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-medium">Not Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">National ID:</h5>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-gray-200">
                      {validatingVoter.nationalid || validatingVoter.national_id}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Database DID:</h5>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-gray-200 break-all">
                      {validatingVoter.did || 'No DID stored in database'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Blockchain DID:</h5>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-gray-200 break-all">
                      {validationResult.did ? (
                        <>
                          {validationResult.did}
                          
                          {/* Always display transaction section when DID is verified */}
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <h6 className="text-xs font-medium text-gray-500 mb-2">Transaction Details:</h6>
                            
                            {validationResult.transactionInfo ? (
                              <>
                                <p className="text-xs mb-1">
                                  <span className="font-semibold">Event:</span> {validationResult.transactionInfo.eventName}
                                </p>
                                {validationResult.transactionInfo.timestamp && (
                                  <p className="text-xs mb-1">
                                    <span className="font-semibold">Time:</span> {new Date(validationResult.transactionInfo.timestamp).toLocaleString()}
                                  </p>
                                )}
                                <p className="text-xs mb-2">
                                  <span className="font-semibold">Transaction Hash:</span> 
                                  <span className="font-mono text-xs break-all">
                                    {validationResult.transactionInfo.hash.substring(0, 10)}...{validationResult.transactionInfo.hash.substring(validationResult.transactionInfo.hash.length - 8)}
                                  </span>
                                </p>
                                <a 
                                  href={`https://testnet.avascan.info/blockchain/c/tx/${validationResult.transactionInfo.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 bg-kweli-primary text-white text-sm font-medium rounded-md hover:bg-kweli-secondary transition-colors duration-200"
                                  title="View transaction on Avalanche Explorer"
                                >
                                  <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View Transaction on Avascan
                                </a>
                              </>
                            ) : (
                              // When DID is verified but transaction info not available,
                              // still provide a link to view the contract with DID information
                              <div className="flex flex-col">
                                <p className="text-xs mb-2 text-amber-600">
                                  DID verified on blockchain but transaction details could not be found.
                                </p>
                                <p className="text-xs mb-3">
                                  You can still view this record on the blockchain explorer.
                                </p>
                                <a 
                                  href={`https://testnet.avascan.info/blockchain/c/address/${blockchainService.voterDIDContractAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 bg-kweli-primary text-white text-sm font-medium rounded-md hover:bg-kweli-secondary transition-colors duration-200"
                                  title="View contract on Avalanche Explorer"
                                >
                                  <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View Contract on Avascan
                                </a>
                              </div>
                            )}
                          </div>
                        </>
                      ) : 'No DID found on blockchain'}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={handleCloseValidation}
                    className="px-5 py-2 text-sm font-medium text-white bg-kweli-primary rounded-lg shadow-soft hover:bg-kweli-secondary transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-700 mb-4">No validation result available.</p>
                <button
                  onClick={handleCloseValidation}
                  className="px-4 py-2 text-sm font-medium text-white bg-kweli-primary rounded-lg shadow-soft hover:bg-kweli-secondary transition-all duration-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to render role badges with appropriate styling
const RoleBadge = ({ role }) => {
  const getBadgeClasses = () => {
    switch(role) {
      case 'Registration Clerk':
        return 'bg-green-50 text-green-700';
      case 'Party Agents':
        return 'bg-purple-50 text-purple-700';
      case 'Presiding Officer (PO)':
        return 'bg-red-50 text-red-700';
      case 'Deputy Presiding Officer (DPO)':
        return 'bg-orange-50 text-orange-700';
      case 'Polling Clerks':
        return 'bg-yellow-50 text-yellow-700';
      case 'Observers':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses()}`}>
      {role}
    </span>
  );
};

export default DataViewer;