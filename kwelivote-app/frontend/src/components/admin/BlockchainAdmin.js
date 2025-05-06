import React, { useState } from 'react';
import BlockchainAccountSetup from './BlockchainAccountSetup';
import BlockchainExplorer from './BlockchainExplorer';
import FingerprintTemplateTest from '../fingerprints/FingerprintTemplateTest';

const BlockchainAdmin = () => {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-kweli-dark mb-2">Testing and Blockchain configurations</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Configure and manage Avalanche blockchain integration, test ISO fingerprint templates and verify DIDs
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white rounded-lg shadow-soft p-1 flex-wrap">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'account' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-soft' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Blockchain Account
          </button>
          <button
            onClick={() => setActiveTab('fingerprint')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'fingerprint' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-soft' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ISO Fingerprint Testing
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'explorer' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-soft' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            DID Verifier
          </button>
        </div>
      </div>

      {/* Active component based on selected tab */}
      <div className="transition-all duration-300">
        {activeTab === 'account' && <BlockchainAccountSetup />}
        {activeTab === 'fingerprint' && <FingerprintTemplateTest />}
        {activeTab === 'explorer' && <BlockchainExplorer />}
      </div>

      {/* Note about security context */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-blue-700">
              <span className="font-bold">Note:</span> This section is restricted to authenticated users and provides tools for testing and configuring the system's blockchain integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAdmin;