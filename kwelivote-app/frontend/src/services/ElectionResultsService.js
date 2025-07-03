/**
 * ElectionResults Contract Service
 * 
 * This service provides methods to interact with the ElectionResults smart contract
 * on the Avalanche blockchain.
 */

import { ethers } from 'ethers';
import ElectionResultsArtifact from '../artifacts/contracts/ElectionResults.sol/ElectionResults.json';

/**
 * Replace this with the actual deployed contract address after deployment
 * This can be stored in a configuration file or environment variable
 */
const CONTRACT_ADDRESS = {
  fuji: 'REPLACE_AFTER_DEPLOYMENT_TO_FUJI',
  mainnet: 'REPLACE_AFTER_DEPLOYMENT_TO_MAINNET',
};

/**
 * ElectionResultsService class for interacting with the contract
 */
class ElectionResultsService {
  constructor(network = 'fuji') {
    this.contractAddress = CONTRACT_ADDRESS[network];
    this.abi = ElectionResultsArtifact.abi;
    this.contract = null;
    this.signer = null;
    this.provider = null;
  }

  /**
   * Initialize the service with a web3 provider
   * @param {Object} provider - Web3 provider (e.g., from MetaMask)
   * @returns {Promise<void>}
   */
  async initialize(provider) {
    try {
      this.provider = new ethers.providers.Web3Provider(provider);
      this.signer = this.provider.getSigner();
      this.contract = new ethers.Contract(this.contractAddress, this.abi, this.signer);
      console.log('ElectionResults contract service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize ElectionResults contract service:', error);
      return false;
    }
  }

  /**
   * Register a key person (election official)
   * @param {string} personAddress - Ethereum address of the person
   * @param {string} nationalId - National ID of the person
   * @param {string} role - Role of the person (e.g., "Presiding Officer (PO)")
   * @param {string} pollingStation - Polling station ID
   * @param {string} party - Political party (for party agents)
   * @param {string} organization - Observer organization (for observers)
   * @returns {Promise<Object>} Transaction result
   */
  async registerKeyPerson(personAddress, nationalId, role, pollingStation, party = '', organization = '') {
    try {
      const tx = await this.contract.registerKeyPerson(
        personAddress,
        nationalId,
        role,
        pollingStation,
        party,
        organization
      );
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Failed to register key person:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Submit election results (Presiding Officer only)
   * @param {string} pollingStationId - ID of the polling station
   * @param {string} electionId - ID of the election
   * @param {string} resultHash - Hash of the complete result data
   * @param {string} resultDataUrl - URL or IPFS hash for full result data
   * @param {number} totalVotes - Total number of votes cast
   * @param {string[]} candidateIds - Array of candidate IDs
   * @param {number[]} votes - Array of vote counts corresponding to candidate IDs
   * @returns {Promise<Object>} Transaction result
   */
  async submitResults(pollingStationId, electionId, resultHash, resultDataUrl, totalVotes, candidateIds, votes) {
    try {
      const tx = await this.contract.submitResults(
        pollingStationId,
        electionId,
        resultHash,
        resultDataUrl,
        totalVotes,
        candidateIds,
        votes
      );
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Failed to submit election results:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sign election results as a Party Agent
   * @param {string} pollingStationId - ID of the polling station
   * @returns {Promise<Object>} Transaction result
   */
  async signAsPartyAgent(pollingStationId) {
    try {
      const tx = await this.contract.signAsPartyAgent(pollingStationId);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Failed to sign as Party Agent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sign election results as an Observer
   * @param {string} pollingStationId - ID of the polling station
   * @returns {Promise<Object>} Transaction result
   */
  async signAsObserver(pollingStationId) {
    try {
      const tx = await this.contract.signAsObserver(pollingStationId);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error('Failed to sign as Observer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get the signature status for a polling station
   * @param {string} pollingStationId - ID of the polling station
   * @returns {Promise<Object>} Signature status
   */
  async getSignatureStatus(pollingStationId) {
    try {
      const result = await this.contract.getSignatureStatus(pollingStationId);
      return {
        success: true,
        presOfficerSigned: result[0],
        partyAgentSigned: result[1],
        observerSigned: result[2],
        isFinalized: result[3],
      };
    } catch (error) {
      console.error('Failed to get signature status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get the basic details of an election result
   * @param {string} pollingStationId - ID of the polling station
   * @returns {Promise<Object>} Election result details
   */
  async getElectionResultDetails(pollingStationId) {
    try {
      const result = await this.contract.getElectionResultDetails(pollingStationId);
      return {
        success: true,
        electionId: result[0],
        resultHash: result[1],
        resultUrl: result[2],
        totalVotes: result[3].toNumber(),
        timestamp: result[4].toNumber(),
        finalized: result[5],
      };
    } catch (error) {
      console.error('Failed to get election result details:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get signer details for a polling station
   * @param {string} pollingStationId - ID of the polling station
   * @returns {Promise<Object>} Signer details
   */
  async getSignerDetails(pollingStationId) {
    try {
      const result = await this.contract.getSignerDetails(pollingStationId);
      return {
        success: true,
        presOfficer: result[0],
        partyAgent: result[1],
        partyName: result[2],
        observer: result[3],
        orgName: result[4],
      };
    } catch (error) {
      console.error('Failed to get signer details:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get the list of candidates for a polling station
   * @param {string} pollingStationId - ID of the polling station
   * @returns {Promise<Object>} List of candidate IDs
   */
  async getCandidates(pollingStationId) {
    try {
      const result = await this.contract.getCandidates(pollingStationId);
      return {
        success: true,
        candidateIds: result,
      };
    } catch (error) {
      console.error('Failed to get candidates:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get votes for a specific candidate at a polling station
   * @param {string} pollingStationId - ID of the polling station
   * @param {string} candidateId - ID of the candidate
   * @returns {Promise<Object>} Number of votes
   */
  async getCandidateVotes(pollingStationId, candidateId) {
    try {
      const result = await this.contract.getCandidateVotes(pollingStationId, candidateId);
      return {
        success: true,
        votes: result.toNumber(),
      };
    } catch (error) {
      console.error('Failed to get candidate votes:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default ElectionResultsService;
