import { ethers } from 'ethers';

/**
 * BlockchainService - Simple service for interacting with Avalanche Fuji testnet C-Chain
 * 
 * This service provides basic functionality for:
 * 1. Connecting to the Avalanche Fuji testnet
 * 2. Managing private keys
 * 3. Deploying and interacting with smart contracts
 * 4. Verifying voter DIDs on the blockchain
 */
class BlockchainService {
  constructor() {
    // Avalanche Fuji Testnet C-Chain Configuration
    this.network = {
      name: 'Avalanche Fuji C-Chain',
      chainId: 43113,
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      explorer: 'https://testnet.snowtrace.io',
    };

    this.provider = null;
    this.signer = null;
    this.voterDIDContract = null;
    this.voterDIDContractAddress = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the blockchain service and connection to Avalanche Fuji C-Chain
   * @returns {boolean} Whether initialization was successful
   */
  async initialize() {
    try {
      // Create an ethers provider for Avalanche Fuji testnet
      this.provider = new ethers.providers.JsonRpcProvider(this.network.rpcUrl);
      
      // Test the connection
      const networkInfo = await this.provider.getNetwork();
      
      // Check if we're connected to the correct network
      if (networkInfo.chainId !== this.network.chainId) {
        console.error('Connected to wrong network', networkInfo);
        return false;
      }
      
      // Check for existing local configuration
      const storedContractAddr = localStorage.getItem('voterDIDContractAddress');
      if (storedContractAddr) {
        this.voterDIDContractAddress = storedContractAddr;
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain connection:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Import a private key for signing transactions
   * @param {string} privateKey - The private key as a hex string
   * @returns {Object} Information about the imported key
   */
  importPrivateKey(privateKey) {
    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, this.provider);
      this.signer = wallet;
      
      return {
        success: true,
        address: wallet.address
      };
    } catch (error) {
      console.error('Failed to import private key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deploy a VoterDID smart contract
   * @returns {Object} Deployment result information
   */
  async deployVoterDIDContract() {
    if (!this.isInitialized || !this.signer) {
      return { 
        success: false,
        error: 'Blockchain not initialized or no private key provided' 
      };
    }

    try {
      // Simple VoterDID contract ABI
      const contractABI = [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "string",
              "name": "nationalId",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "did",
              "type": "string"
            }
          ],
          "name": "DIDRegistered",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "name": "voterDIDs",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "nationalId",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "did",
              "type": "string"
            }
          ],
          "name": "registerDID",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "nationalId",
              "type": "string"
            }
          ],
          "name": "getDID",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      // Simple VoterDID contract bytecode
      const contractBytecode = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506106c8806100606000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063122dfb5d1461004657806330d835f514610076578063f0766b7c146100a6575b600080fd5b610060600480360381019061005b9190610342565b6100d6565b60405161006d9190610400565b60405180910390f35b610090600480360381019061008b9190610342565b610189565b60405161009d9190610400565b60405180910390f35b6100d060048036038101906100cb919061044c565b61022a565b005b6060600160008360405161009d9190610570565b602052602001908152602001600020805461010590610622565b80601f016020809104026020016040519081016040528092919081815260200182805461013190610622565b801561017e5780601f106101535761010080835404028352916020019161017e565b820191906000526020600020905b81548152906001019060200180831161016157829003601f168201915b50505050509050919050565b6060600160008360405161009d9190610570565b602052602001908152602001600020805461018590610622565b80601f01602080910402602001604051908101604052809291908181526020018280546101b190610622565b80156101fe5780601f106101d3576101008083540402835291602001916101fe565b820191906000526020600020905b8154815290600101906020018083116101e157829003601f168201915b50505050509050919050565b80600160008460405161009d9190610570565b602052602001908152602001600020908051906020019061025f929190610263565b505050565b82805461026f90610622565b90600052602060002090601f01602090048101928261029157600085556102d8565b82601f106102aa57805160ff19168380011785556102d8565b828001600101855582156102d8579182015b828111156102d75782518255916020019190600101906102bc565b5b5090506102e591906102e9565b5090565b5b808211156103025760008160009055506001016102ea565b5090565b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f84011261033657610335610317565b5b8235905067ffffffffffffffff81111561035357610352610311565b5b6020830191508360018202830111156103905761038f610331565b5b9250929050565b6000602082840312156103ad576103ac610309565b5b600082013567ffffffffffffffff8111156103cb576103ca61030d565b5b6103d784828501610320565b91509150509291505050565b600081519050919050565b600082825260208201905092915050565b60005b838110156104245780820151818401526020810190506104095b5090565b83811115610433576000848401525b50505050565b6000601f19601f8301169050919050565b60006104558261030e565b915061046183836103f7565b925082821015610474576104736106a3565b5b828203905092915050565b60008060006040848603121561049857610497610309565b5b600084013567ffffffffffffffff8111156104b6576104b561030d565b5b6104c286828701610320565b935093505060208401356104d7816106aa565b809150509250925092565b600082825260208201905092915050565b82818337600083830152505050565b61050a816104e3565b61051481846104f2565b925061051f826104f2565b8201602081018481026001851660008114610540578960005b8282101561053c578983030183526105318582516105dc565b84549086905061054290836106bf565b92509080100156105185790505b505b50505050565b61056a828560408301376000818301604090810191505b5082821061056257838301600082600101600083610549565b600101610558565b5050505050565b6000610587826105678261041b565b602083026020845184600181146105bf5790506105bf82826105c3565b8460018114156105d357505050506105d7565b505050505b919050565b6000610588826105008261041b565b602083026020845184600181146105bf5790506105bf82826105c3565b6000602082019050919050565b60006060820190506106178482516104f9565b92915050565b600061062990610439565b905061063582826105d4565b919050565b6000819050919050565b6000819050919050565b600061066c61066761066284610644565b610647565b61063b565b9050919050565b600061067e82610651565b9050919050565b600061069082610673565b9050919050565b6106a081610685565b81146106ab57600080fd5b50565b6106b381610309565b81146106be57600080fd5b50565b60006106ca82610309565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156106fd576106fc6106a3565b5b60018260000101049050919050565b6107128161030e565b811461071d57600080fd5b5090565b61072982610309565b811461073457600080fd5b50565b61074081610331565b811461074b57600080fd5b5090565b61075781610547565b811461076257600080fd5b50565b61076e81610550565b811461077957600080fd5b5090565b61078581610559565b811461079057600080fd5b5050565b61079c81610562565b81146107a757600080fd5b5090565b6107b38161056b565b81146107be57600080fd5b5090565b6107ca81610574565b81146107d557600080fd5b5090565b6107e18161057d565b81146107ec57600080fd5b5090565b6107f881610586565b811461080357600080fd5b5090565b61080f8161058f565b811461081a57600080fd5b5090565b61082681610598565b811461083157600080fd5b5090565b61083d816105a1565b811461084857600080fd5b5090565b6108548161063b565b811461085f57600080fd5b5090565b61086b81610644565b811461087657600080fd5b5090565b61088281610647565b811461088d57600080fd5b5090565b61089981610651565b81146108a457600080fd5b5090565b6108b081610673565b81146108bb57600080fd5b5090565b6108c781610685565b81146108d257600080fd5b5090565b6108de816105aa565b81146108e957600080fd5b5090565b6108f5816105b3565b811461090057600080fd5b5090565b61090c816105bc565b811461091757600080fd5b5090565b6000819050919050565b61092d8161091d565b811461093857600080fd5b50565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b600081519050919050565b6000602082019050919050565b61e9eb8161091d565b8114610e9f57600080fd5b50565b61e9ab816105c5565b8114610eaf57600080fd5b50565b61e9bb816105ce565b8114610ebf57600080fd5b50565b61e9cb816105d7565b8114610ecf57600080fd5b50565b61e9db816105e0565b8114610edf57600080fd5b50565b61e9eb816105e9565b8114610eef57600080fd5b50565b61e9fb816105f2565b8114610eff57600080fd5b50565b61ea0b816105fb565b8114610f0f57600080fd5b50565b61ea1b81610604565b8114610f1f57600080fd5b50565b61ea2b8161060d565b8114610f2f57600080fd5b50565b61ea3b81610616565b8114610f3f57600080fd5b50565b61ea4b8161061f565b8114610f4f57600080fd5b50565b61ea5b81610628565b8114610f5f57600080fd5b50565b61ea6b81610631565b8114610f6f57600080fd5b50565b61ea7b8161063a565b8114610f7f57600080fd5b50565b61ea8b81610b77565b8114610f8f57600080fd5b50565b61ea9b81610b80565b8114610f9f57600080fd5b50565b61eaab81610b89565b8114610faf57600080fd5b50565b61eabb81610b92565b8114610fbf57600080fd5b50565b61eacb81610b9b565b8114610fcf57600080fd5b50565b61eadb81610ba4565b8114610fdf57600080fd5b50565b61eaeb81610bad565b8114610fef57600080fd5b50565b61eafb81610bb6565b8114610fff57600080fd5b50565b61eb0b81610bbf565b811461100f57600080fd5b50565b61eb1b81610bc8565b811461101f57600080fd5b50565b61eb2b81610bd1565b811461102f57600080fd5b50565b61eb3b81610bda565b811461103f57600080fd5b50565b61eb4b81610be3565b811461104f57600080fd5b50565b61eb5b81610bec565b811461105f57600080fd5b50565b61eb6b81610bf5565b811461106f57600080fd5b50565b61eb7b81610bfe565b811461107f57600080fd5b50565b61eb8b81610c07565b811461108f57600080fd5b50565b61eb9b81610c10565b811461109f57600080fd5b50565b61ebab81610c19565b8114610d0f57600080fd5b50565b61ebbb81610c22565b8114610d1f57600080fd5b50565b61ebcb81610c2b565b8114610d2f57600080fd5b50565b61ebdb81610c34565b8114610d3f57600080fd5b50565b61ebeb81610c3d565b8114610d4f57600080fd5b50565b61ebfb81610c46565b8114610d5f57600080fd5b50565b61ec0b81610c4f565b8114610d6f57600080fd5b50565b61ec1b81610c58565b8114610d7f57600080fd5b50565b61ec2b81610c61565b8114610d8f57600080fd5b50565b61ec3b81610c6a565b8114610d9f57600080fd5b50565b61ec4b81610c73565b8114610daf57600080fd5b50565b61ec5b81610c7c565b8114610dbf57600080fd5b50565b61ec6b81610c85565b8114610dcf57600080fd5b50565b61ec7b81610c8e565b8114610ddf57600080fd5b50565b61ec8b81610c97565b8114610def57600080fd5b50565b61ec9b81610ca0565b8114610dff57600080fd5b50565b61ecab81610ca9565b8114610e0f57600080fd5b50565b61ecbb81610cb2565b8114610e1f57600080fd5b50565b61eccb81610cbb565b8114610e2f57600080fd5b50565b61ecdb81610cc4565b8114610e3f57600080fd5b50565b61eceb81610ccd565b8114610e4f57600080fd5b50565b61ecfb81610cd6565b8114610e5f57600080fd5b50565b61ed0b81610cdf565b8114610e6f57600080fd5b50565b61ed1b81610ce8565b8114610e7f57600080fd5b50565b61ed2b81610cf1565b8114610e8f57600080fd5b50565b61ed3b81610cfa565b8114610e9f57600080fd5b50565b61ed4b81610d03565b8114610eaf57600080fd5b50565b61ed5b81610d0c565b8114610ebf57600080fd5b50565b61ed6b81610d15565b8114610ecf57600080fd5b50565b61ed7b81610d1e565b8114610edf57600080fd5b50565b61ed8b81610d27565b8114610eef57600080fd5b50565b61ed9b81610d30565b8114610eff57600080fd5b50565b61edab81610d39565b8114610f0f57600080fd5b50565b61edbb81610d42565b8114610f1f57600080fd5b50565b61edcb81610d4b565b8114610f2f57600080fd5b50565b61eddb81610d54565b8114610f3f57600080fd5b50565b61edeb81610d5d565b8114610f4f57600080fd5b50565b61edfb81610d66565b8114610f5f57600080fd5b50565b61ee0b81610d6f565b8114610f6f57600080fd5b50565b61ee1b81610d78565b8114610f7f57600080fd5b50565b61ee2b81610d81565b8114610f8f57600080fd5b50565b61ee3b81610d8a565b8114610f9f57600080fd5b50565b61ee4b81610d93565b8114610faf57600080fd5b50565b61ee5b81610d9c565b8114610fbf57600080fd5b50565b61ee6b81610da5565b8114610fcf57600080fd5b50565b61ee7b81610dae565b8114610fdf57600080fd5b50565b61ee8b81610db7565b8114610fef57600080fd5b50565b61ee9b81610dc0565b8114610fff57600080fd5b50565b61eeab81610dc9565b811461100f57600080fd5b50565b61eebb81610dd2565b811461101f57600080fd5b50565b61eecb81610ddb565b811461102f57600080fd5b50565b61eedb81610de4565b811461103f57600080fd5b50565b61eeeb81610ded565b811461104f57600080fd5b50565b61eefb81610df6565b811461105f57600080fd5b50565b61ef0b81610dff565b811461106f57600080fd5b50565b61ef1b81610e08565b811461107f57600080fd5b50565b61ef2b81610e11565b811461108f57600080fd5b50565b61ef3b81610e1a565b811461109f57600080fd5b50565b61ef4b81610e23565b8114611090157600080fd5b50565b61ef5b81610e2c565b8114611091157600080fd5b50565b61ef6b81610e35565b8114611092157600080fd5b50565b61ef7b81610e3e565b8114611093157600080fd5b5090565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fdfea2646970667358221220675589d244c5f1a4c43d3baeee2202a219e69d9febdf68ce8a55b6ba0272239364736f6c63430008040033";

      // Deploy the contract
      const factory = new ethers.ContractFactory(contractABI, contractBytecode, this.signer);
      const contract = await factory.deploy();
      
      // Wait for deployment to complete
      await contract.deployed();
      
      // Save the contract address
      this.voterDIDContractAddress = contract.address;
      localStorage.setItem('voterDIDContractAddress', this.voterDIDContractAddress);
      
      // Initialize contract instance
      this.voterDIDContract = new ethers.Contract(
        this.voterDIDContractAddress,
        contractABI,
        this.signer
      );
      
      return {
        success: true,
        contractAddress: this.voterDIDContractAddress,
        transactionHash: contract.deployTransaction.hash
      };
    } catch (error) {
      console.error('Failed to deploy contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store a DID on the blockchain
   * @param {string} nationalId - The voter's national ID
   * @param {string} did - The DID to store
   * @returns {Object} Transaction result information
   */
  async storeDID(nationalId, did) {
    if (!this.isInitialized || !this.signer) {
      return { 
        success: false,
        error: 'Blockchain not initialized or no private key provided' 
      };
    }

    if (!this.voterDIDContract) {
      return { 
        success: false,
        error: 'VoterDID contract not deployed' 
      };
    }

    try {
      // Call the contract to store the DID
      const tx = await this.voterDIDContract.registerDID(nationalId, did);
      
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to store DID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a voter's DID on the blockchain
   * @param {string} nationalId - The voter's national ID
   * @returns {Object} Verification result
   */
  async verifyVoterDID(nationalId) {
    if (!this.isInitialized) {
      return { 
        success: false,
        error: 'Blockchain not initialized' 
      };
    }

    if (!this.voterDIDContractAddress) {
      return { 
        success: false,
        error: 'VoterDID contract not deployed' 
      };
    }

    try {
      // Create a read-only contract instance if we don't have a signer
      const contractABI = [
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "nationalId",
              "type": "string"
            }
          ],
          "name": "getDID",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      
      const contract = new ethers.Contract(
        this.voterDIDContractAddress,
        contractABI,
        this.provider
      );
      
      // Get the stored DID for the national ID
      const storedDID = await contract.getDID(nationalId);
      
      // Check if the DID exists
      const isVerified = storedDID && storedDID.length > 0;
      
      return {
        success: true,
        isVerified,
        nationalId,
        did: storedDID,
        message: isVerified ? 'Voter identity verified on blockchain' : 'No identity found for this voter'
      };
    } catch (error) {
      console.error('Failed to verify voter DID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup blockchain infrastructure
   * @param {Object} config - Configuration for blockchain setup
   * @returns {Object} Setup result information
   */
  async setupBlockchainInfrastructure(config) {
    if (!this.isInitialized || !this.signer) {
      return { 
        success: false,
        error: 'Blockchain not initialized or no private key provided' 
      };
    }
    
    try {
      // Deploy the VoterDID contract if not already deployed
      if (!this.voterDIDContractAddress) {
        const deployResult = await this.deployVoterDIDContract();
        if (!deployResult.success) {
          return deployResult;
        }
      }
      
      return {
        success: true,
        network: this.network.name,
        chainId: this.network.chainId,
        contractAddress: this.voterDIDContractAddress,
        message: 'Blockchain infrastructure setup complete'
      };
    } catch (error) {
      console.error('Failed to setup blockchain infrastructure:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get blockchain network information
   * @returns {Object} Network information
   */
  getNetworkInfo() {
    return {
      name: this.network.name,
      chainId: this.network.chainId,
      rpcUrl: this.network.rpcUrl,
      explorer: this.network.explorer,
      isConnected: this.isInitialized
    };
  }

  /**
   * Get transaction URL in block explorer
   * @param {string} txHash - Transaction hash
   * @returns {string} URL to the transaction in block explorer
   */
  getTransactionUrl(txHash) {
    return `${this.network.explorer}/tx/${txHash}`;
  }

  /**
   * Get contract URL in block explorer
   * @param {string} address - Contract address
   * @returns {string} URL to the contract in block explorer
   */
  getContractUrl(address) {
    return `${this.network.explorer}/address/${address}`;
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;