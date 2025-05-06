import React, { useState, useEffect } from 'react';
import blockchainService from '../../services/BlockchainService';

const BlockchainAccountSetup = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [error, setError] = useState('');

  // Initialize blockchain service
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        await blockchainService.initialize();
      } catch (err) {
        console.error('Failed to initialize blockchain service:', err);
      }
    };
    
    initBlockchain();
  }, []);

  // Validate private key and get account information
  const validateAccount = async () => {
    if (!privateKey.trim()) {
      setError('Please enter a private key');
      return;
    }

    setError('');
    setIsValidating(true);
    
    try {
      // Import the private key to get the address
      const importResult = await blockchainService.importPrivateKey(privateKey);
      
      if (!importResult.success) {
        throw new Error(importResult.error || 'Invalid private key');
      }
      
      // Get the account balance
      const balance = await blockchainService.getAccountBalance(importResult.address);
      
      setAccountInfo({
        address: importResult.address,
        balance: balance,
        networkInfo: blockchainService.getNetworkInfo()
      });
    } catch (err) {
      console.error('Error validating account:', err);
      setError(err.message || 'Failed to validate account');
      setAccountInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle input change
  const handleKeyChange = (e) => {
    setPrivateKey(e.target.value);
    // Reset error and account info when changing the key
    if (error) setError('');
    if (accountInfo) setAccountInfo(null);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    validateAccount();
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-2">Blockchain Account Setup</h2>
          <p className="text-gray-600">
            Enter your Avalanche private key to validate your account and view your balance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Private Key Input */}
          <div>
            <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-1">
              Avalanche Private Key
            </label>
            <div className="relative">
              <input
                id="privateKey"
                name="privateKey"
                type={showPrivateKey ? "text" : "password"}
                value={privateKey}
                onChange={handleKeyChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary"
                placeholder="Enter your Avalanche private key"
                required
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPrivateKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Your private key is never stored. It's only used to validate your account and display balance.
            </p>
          </div>

          {/* Validate Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-kweli-primary hover:bg-kweli-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary"
              disabled={isValidating || !privateKey.trim()}
            >
              {isValidating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validating Account...
                </div>
              ) : 'Validate Account'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Account Information */}
        {accountInfo && (
          <div className="mt-6">
            <div className="border border-green-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {/* Account Address */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Address</p>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">{accountInfo.address}</p>
                  </div>
                  
                  {/* Account Balance */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">AVAX Balance</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {accountInfo.balance} AVAX
                    </p>
                  </div>
                  
                  {/* Network Information */}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Network</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {accountInfo.networkInfo.name} (Chain ID: {accountInfo.networkInfo.chainId})
                    </p>
                  </div>

                  {/* Success Icon */}
                  <div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-green-700 font-medium">Account validated successfully!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information section */}
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About Blockchain Accounts</h3>
            <p className="text-sm text-gray-600 mb-2">
              The KweliVote system uses Avalanche blockchain accounts to securely manage voter Decentralized Identifiers (DIDs)
              and ensure the integrity of the electoral process.
            </p>
            <p className="text-sm text-gray-600">
              Your private key provides access to your blockchain account. Never share your private key with anyone 
              and make sure you have sufficient AVAX to perform blockchain operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAccountSetup;