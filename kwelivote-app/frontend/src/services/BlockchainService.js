/**
 * Blockchain Service
 * 
 * This service provides high-level functions for blockchain operations,
 * specifically for managing voter DIDs on the Avalanche subnet.
 */

import { 
  initAvalanche,
  createSubnet,
  createBlockchain,
  deployVoterDIDContract,
  storeVoterDID,
  verifyVoterDID
} from '../utils/avalancheUtils';

class BlockchainService {
  constructor() {
    this.isInitialized = false;
    
    // Read key from secure storage (for demo purposes only)
    // In production, this would use a better key management system
    this.adminKey = localStorage.getItem('avalanche_admin_key') || '';
    
    this.subnetId = localStorage.getItem('avalanche_subnet_id') || '';
    this.blockchainId = localStorage.getItem('avalanche_blockchain_id') || '';
    this.contractAddress = localStorage.getItem('voter_did_contract_address') || '';
    
    // Store blockchain configuration parameters
    this.blockchainConfig = JSON.parse(localStorage.getItem('blockchain_config')) || {
      subnetName: 'KweliVoteSubnet',
      blockchainName: 'KweliVoteChain',
      tokenName: 'KweliToken',
      tokenSymbol: 'KLI',
      tokenDecimals: 18,
      feeRecipient: '',
      mintAllowance: '1000000'
    };
  }
  
  /**
   * Initialize the blockchain service and set up needed components
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Initialize Avalanche connection
      initAvalanche();
      
      // Check if we need to create subnet and blockchain
      if (!this.subnetId || !this.blockchainId || !this.contractAddress) {
        console.log('Blockchain components not found. Run setup first.');
      } else {
        console.log('Blockchain service initialized with existing components:');
        console.log('Subnet ID:', this.subnetId);
        console.log('Blockchain ID:', this.blockchainId);
        console.log('Contract Address:', this.contractAddress);
        console.log('Blockchain Config:', this.blockchainConfig);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }
  
  /**
   * Set up a new Avalanche subnet, blockchain, and deploy the VoterDID contract
   * @param {string} adminKey - Private key for the admin account
   * @param {object} blockchainConfig - Configuration parameters for the blockchain
   */
  async setupBlockchainInfrastructure(adminKey, blockchainConfig = {}) {
    try {
      if (!adminKey) {
        throw new Error('Admin key is required for setup');
      }
      
      // Store admin key (for demo only - use proper key management in production)
      this.adminKey = adminKey;
      localStorage.setItem('avalanche_admin_key', adminKey);
      
      // Save blockchain configuration
      this.blockchainConfig = {
        ...this.blockchainConfig,
        ...blockchainConfig
      };
      localStorage.setItem('blockchain_config', JSON.stringify(this.blockchainConfig));
      console.log('Using blockchain configuration:', this.blockchainConfig);
      
      // Create subnet with custom name
      const subnetResult = await createSubnet(
        adminKey, 
        this.blockchainConfig.subnetName
      );
      
      if (!subnetResult.success) {
        throw new Error(`Failed to create subnet: ${subnetResult.error}`);
      }
      
      this.subnetId = subnetResult.subnetId;
      localStorage.setItem('avalanche_subnet_id', this.subnetId);
      console.log(`Created subnet "${this.blockchainConfig.subnetName}" with ID:`, this.subnetId);
      
      // Create blockchain on subnet with custom VM name
      const blockchainResult = await createBlockchain(
        adminKey, 
        this.subnetId, 
        this.blockchainConfig.blockchainName
      );
      
      if (!blockchainResult.success) {
        throw new Error(`Failed to create blockchain: ${blockchainResult.error}`);
      }
      
      this.blockchainId = blockchainResult.blockchainId;
      localStorage.setItem('avalanche_blockchain_id', this.blockchainId);
      console.log(`Created blockchain "${this.blockchainConfig.blockchainName}" with ID:`, this.blockchainId);
      
      // Deploy VoterDID contract with token configuration
      const deployResult = await deployVoterDIDContract(
        adminKey, 
        this.blockchainId,
        {
          tokenName: this.blockchainConfig.tokenName,
          tokenSymbol: this.blockchainConfig.tokenSymbol,
          tokenDecimals: this.blockchainConfig.tokenDecimals,
          feeRecipient: this.blockchainConfig.feeRecipient || null,
          mintAllowance: this.blockchainConfig.mintAllowance
        }
      );
      
      if (!deployResult.success) {
        throw new Error(`Failed to deploy contract: ${deployResult.error}`);
      }
      
      this.contractAddress = deployResult.contractAddress;
      localStorage.setItem('voter_did_contract_address', this.contractAddress);
      console.log(`Deployed VoterDID contract with token "${this.blockchainConfig.tokenName}" (${this.blockchainConfig.tokenSymbol}) at:`, this.contractAddress);
      
      return {
        success: true,
        subnetId: this.subnetId,
        blockchainId: this.blockchainId,
        contractAddress: this.contractAddress,
        blockchainConfig: this.blockchainConfig
      };
    } catch (error) {
      console.error('Error setting up blockchain infrastructure:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Register a voter's DID on the blockchain
   */
  async registerVoterDID(voterDID, nationalId) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      if (!this.adminKey) {
        throw new Error('Admin key not available. Please set up blockchain infrastructure first.');
      }
      
      const result = await storeVoterDID(voterDID, nationalId, this.adminKey);
      
      if (!result.success) {
        throw new Error(`Failed to store DID on blockchain: ${result.error}`);
      }
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        message: 'Voter DID successfully registered on blockchain'
      };
    } catch (error) {
      console.error('Error registering voter DID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify a voter's DID on the blockchain
   */
  async verifyVoterDID(nationalId) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      const result = await verifyVoterDID(nationalId);
      
      if (!result.success) {
        throw new Error(`Failed to verify DID: ${result.error}`);
      }
      
      return {
        success: true,
        did: result.did,
        isVerified: result.isVerified
      };
    } catch (error) {
      console.error('Error verifying voter DID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get the current blockchain configuration
   */
  getBlockchainConfig() {
    return this.blockchainConfig;
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;