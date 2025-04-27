import React, { useState, useEffect } from 'react';
import blockchainService from '../../services/BlockchainService';

const BlockchainExplorer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState({
    initialized: false,
    message: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        const isInitialized = await blockchainService.initialize();
        setBlockchainStatus({
          initialized: isInitialized,
          message: isInitialized 
            ? 'Connected to Avalanche blockchain' 
            : 'Blockchain not configured. Please set up the blockchain infrastructure first.'
        });
      } catch (err) {
        console.error('Failed to initialize blockchain service:', err);
        setBlockchainStatus({
          initialized: false,
          message: `Blockchain initialization error: ${err.message}`
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initBlockchain();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a National ID to search');
      return;
    }
    
    setError('');
    setSearchResult(null);
    setIsVerifying(true);
    
    try {
      const result = await blockchainService.verifyVoterDID(searchTerm);
      
      if (result.success) {
        setSearchResult({
          nationalId: searchTerm,
          did: result.did,
          isVerified: result.isVerified,
          message: result.isVerified 
            ? 'Voter DID found on the blockchain' 
            : 'No DID found for this National ID'
        });
      } else {
        throw new Error(result.error || 'Failed to verify voter DID');
      }
    } catch (err) {
      console.error('Error verifying voter DID:', err);
      setError(err.message || 'An error occurred while searching the blockchain');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kweli-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-2">Blockchain DID Explorer</h2>
          <p className="text-gray-600">
            Search and verify voter DIDs stored on the Avalanche subnet
          </p>
        </div>
        
        {/* Blockchain Status */}
        <div className={`mb-6 p-4 rounded-lg border ${blockchainStatus.initialized ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center">
            {blockchainStatus.initialized ? (
              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-yellow-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`font-medium ${blockchainStatus.initialized ? 'text-green-800' : 'text-yellow-800'}`}>
              {blockchainStatus.message}
            </span>
          </div>
        </div>
        
        {!blockchainStatus.initialized ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-blue-700">Please set up the blockchain infrastructure before using the explorer.</p>
                <p className="text-blue-700 mt-1">Navigate to the blockchain setup page to configure the Avalanche subnet.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
                    National ID
                  </label>
                  <input
                    id="nationalId"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter national ID to verify"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary"
                    disabled={isVerifying}
                  />
                </div>
                <div className="self-end">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-kweli-primary hover:bg-kweli-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary"
                    disabled={isVerifying || !searchTerm.trim()}
                  >
                    {isVerifying ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </div>
                    ) : 'Verify DID'}
                  </button>
                </div>
              </div>
            </form>
            
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {searchResult && (
              <div className="mb-6">
                <div className={`border rounded-lg overflow-hidden ${searchResult.isVerified ? 'border-green-200' : 'border-gray-200'}`}>
                  <div className={`px-4 py-3 ${searchResult.isVerified ? 'bg-green-50' : 'bg-gray-50'} border-b ${searchResult.isVerified ? 'border-green-200' : 'border-gray-200'}`}>
                    <h3 className="text-lg font-medium text-gray-900">Verification Result</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">National ID</p>
                        <p className="mt-1 text-sm text-gray-900">{searchResult.nationalId}</p>
                      </div>
                      
                      {searchResult.isVerified ? (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-500">DID</p>
                            <p className="mt-1 text-sm text-gray-900 font-mono break-all">{searchResult.did}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-green-700 font-medium">{searchResult.message}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-yellow-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-yellow-700 font-medium">{searchResult.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Information section */}
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About Blockchain Verification</h3>
            <p className="text-sm text-gray-600 mb-2">
              The KweliVote system stores voter Decentralized Identifiers (DIDs) on a custom Avalanche blockchain subnet to ensure
              the integrity and transparency of the voter registration process.
            </p>
            <p className="text-sm text-gray-600">
              By verifying a voter's National ID in this tool, you can confirm that their identity has been properly recorded
              on the blockchain and is ready for participation in the electoral process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;