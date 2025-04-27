import React, { useState, useEffect } from 'react';
import blockchainService from '../../services/BlockchainService';

const BlockchainSetup = () => {
  const [status, setStatus] = useState({
    isInitialized: false,
    subnetId: '',
    blockchainId: '',
    contractAddress: '',
    message: 'Checking blockchain status...'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New blockchain configuration states
  const [blockchainConfig, setBlockchainConfig] = useState({
    subnetName: 'KweliVoteSubnet',
    blockchainName: 'KweliVoteChain',
    tokenName: 'KweliToken',
    tokenSymbol: 'KLI',
    tokenDecimals: 18,
    feeRecipient: '',
    mintAllowance: '1000000'
  });
  
  // Handle blockchain config changes
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setBlockchainConfig({
      ...blockchainConfig,
      [name]: value
    });
  };

  useEffect(() => {
    const checkBlockchainStatus = async () => {
      try {
        await blockchainService.initialize();
        setStatus({
          isInitialized: blockchainService.isInitialized,
          subnetId: blockchainService.subnetId || '',
          blockchainId: blockchainService.blockchainId || '',
          contractAddress: blockchainService.contractAddress || '',
          message: blockchainService.isInitialized 
            ? 'Blockchain infrastructure is set up and ready'
            : 'Blockchain infrastructure needs to be set up'
        });
      } catch (error) {
        console.error('Error checking blockchain status:', error);
        setError('Failed to check blockchain status: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkBlockchainStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!privateKey) {
        throw new Error('Please enter your Avalanche private key');
      }

      // Pass the blockchain configuration to the service
      const result = await blockchainService.setupBlockchainInfrastructure(
        privateKey, 
        blockchainConfig
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to set up blockchain infrastructure');
      }

      setStatus({
        isInitialized: true,
        subnetId: result.subnetId,
        blockchainId: result.blockchainId,
        contractAddress: result.contractAddress,
        message: 'Blockchain infrastructure successfully set up'
      });
      
      setSuccess(`Blockchain infrastructure has been successfully set up for KweliVote with subnet name: ${blockchainConfig.subnetName}`);
      
      // Clear private key for security
      setPrivateKey('');
    } catch (error) {
      console.error('Error setting up blockchain:', error);
      setError(error.message || 'An error occurred while setting up blockchain infrastructure');
    } finally {
      setIsSubmitting(false);
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
          <h2 className="text-2xl font-bold text-kweli-dark mb-2">Blockchain Infrastructure Setup</h2>
          <p className="text-gray-600">
            Configure the Avalanche blockchain subnet for storing voter DIDs
          </p>
        </div>

        {/* Blockchain Status */}
        <div className={`mb-8 p-4 rounded-lg ${status.isInitialized ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border`}>
          <h3 className="font-semibold text-lg mb-2">
            {status.isInitialized ? 'Blockchain Status: Active' : 'Blockchain Status: Not Configured'}
          </h3>
          
          <p className="mb-3 text-gray-700">{status.message}</p>
          
          {status.isInitialized && (
            <div className="space-y-2 font-mono text-sm">
              <div className="bg-white p-2 rounded border border-green-100">
                <span className="font-semibold text-green-800">Subnet ID:</span> 
                <span className="text-gray-700 ml-2">{status.subnetId}</span>
              </div>
              <div className="bg-white p-2 rounded border border-green-100">
                <span className="font-semibold text-green-800">Blockchain ID:</span> 
                <span className="text-gray-700 ml-2">{status.blockchainId}</span>
              </div>
              <div className="bg-white p-2 rounded border border-green-100">
                <span className="font-semibold text-green-800">Smart Contract:</span> 
                <span className="text-gray-700 ml-2">{status.contractAddress}</span>
              </div>
            </div>
          )}
        </div>

        {!status.isInitialized && (
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
                  onChange={(e) => setPrivateKey(e.target.value)}
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
                This private key will be used to create a subnet and deploy the smart contract.
                Make sure you have enough AVAX in this account.
              </p>
            </div>
            
            {/* Blockchain Configuration Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-lg mb-4 text-kweli-dark">Blockchain Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subnet Name */}
                <div>
                  <label htmlFor="subnetName" className="block text-sm font-medium text-gray-700 mb-1">
                    Subnet Name
                  </label>
                  <input
                    id="subnetName"
                    name="subnetName"
                    type="text"
                    value={blockchainConfig.subnetName}
                    onChange={handleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name for your custom Avalanche subnet
                  </p>
                </div>
                
                {/* Blockchain Name */}
                <div>
                  <label htmlFor="blockchainName" className="block text-sm font-medium text-gray-700 mb-1">
                    Blockchain Name
                  </label>
                  <input
                    id="blockchainName"
                    name="blockchainName"
                    type="text"
                    value={blockchainConfig.blockchainName}
                    onChange={handleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name for the blockchain VM on your subnet
                  </p>
                </div>
                
                {/* Token Name */}
                <div>
                  <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700 mb-1">
                    Token Name
                  </label>
                  <input
                    id="tokenName"
                    name="tokenName"
                    type="text"
                    value={blockchainConfig.tokenName}
                    onChange={handleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name for your blockchain's native token
                  </p>
                </div>
                
                {/* Token Symbol */}
                <div>
                  <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-700 mb-1">
                    Token Symbol
                  </label>
                  <input
                    id="tokenSymbol"
                    name="tokenSymbol"
                    type="text"
                    value={blockchainConfig.tokenSymbol}
                    onChange={handleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary text-sm"
                    maxLength={5}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Symbol for your token (2-5 characters)
                  </p>
                </div>
                
                {/* Token Decimals */}
                <div>
                  <label htmlFor="tokenDecimals" className="block text-sm font-medium text-gray-700 mb-1">
                    Token Decimals
                  </label>
                  <input
                    id="tokenDecimals"
                    name="tokenDecimals"
                    type="number"
                    min="0"
                    max="18"
                    value={blockchainConfig.tokenDecimals}
                    onChange={handleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Number of decimal places (0-18, typically 18)
                  </p>
                </div>
                
                {/* Fee Recipient */}
                <div>
                  <label htmlFor="feeRecipient" className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Recipient (optional)
                  </label>
                  <input
                    id="feeRecipient"
                    name="feeRecipient"
                    type="text"
                    value={blockchainConfig.feeRecipient}
                    onChange={handleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-primary focus:border-kweli-primary text-sm"
                    placeholder="0x..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ethereum address that receives transaction fees
                  </p>
                </div>
              </div>
              
              {/* Advanced Configuration Notice */}
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-blue-700">
                    For advanced configurations like gas parameters, consensus settings, or precompiles, 
                    please contact system administrators.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-kweli-primary hover:bg-kweli-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kweli-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting up Avalanche subnet...
                  </div>
                ) : 'Set Up Blockchain Infrastructure'}
              </button>
            </div>
          </form>
        )}

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

        {success && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About Avalanche Subnets</h3>
            <p className="text-sm text-gray-600 mb-2">
              Avalanche subnets are custom, independent blockchains that can have their own validator sets and consensus rules.
              They're ideal for applications that need dedicated blockchain infrastructure.
            </p>
            <p className="text-sm text-gray-600">
              KweliVote uses a custom Avalanche subnet to store voter DIDs securely and immutably, ensuring
              that the voter registration process is transparent and tamper-proof.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainSetup;