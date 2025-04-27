import React, { useState } from 'react';
import BlockchainSetup from './BlockchainSetup';
import BlockchainExplorer from './BlockchainExplorer';

const BlockchainAdmin = () => {
  const [activeTab, setActiveTab] = useState('setup');

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-kweli-dark mb-2">Blockchain Administration</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Configure and manage the Avalanche blockchain integration for secure voter DID storage and verification
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white rounded-lg shadow-soft p-1">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'setup' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-soft' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Blockchain Setup
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'explorer' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-soft' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            DID Verifier
          </button>
        </div>
      </div>

      {/* Active component based on selected tab */}
      <div className="transition-all duration-300">
        {activeTab === 'setup' && <BlockchainSetup />}
        {activeTab === 'explorer' && <BlockchainExplorer />}
      </div>

      {/* Note about demo mode */}
      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-yellow-700">
              <span className="font-bold">Demo Mode:</span> This blockchain administration interface is accessible without authentication for demonstration purposes only.
            </p>
            <p className="text-yellow-700 mt-1">
              In a production environment, these functions would be restricted to authorized administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAdmin;