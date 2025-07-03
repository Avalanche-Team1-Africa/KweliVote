// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ElectionResults
 * @dev Smart contract for storing and verifying election results with multi-stakeholder signatures
 * This contract requires signatures from a Presiding Officer, a Party Agent, and an Observer
 * before finalizing the election results on the Avalanche blockchain.
 */
contract ElectionResults {
    // Contract owner (typically the election commission or authorized entity)
    address public owner;
    
    // Structure to store election result information
    struct ElectionResult {
        string pollingStationId;
        string electionId;
        string resultHash;           // Hash of the complete result data (stored off-chain)
        string resultDataUrl;        // URL or IPFS hash where full result data is stored
        uint256 totalVotes;          // Total number of votes cast
        mapping(string => uint256) candidateVotes; // Mapping from candidate ID to vote count
        string[] candidateIds;       // Array of candidate IDs for iteration
        
        // Approval status
        bool presidingOfficerSigned;
        address presidingOfficer;
        
        bool partyAgentSigned;
        address partyAgent;
        string partyAgentParty;      // Political party of the agent
        
        bool observerSigned;
        address observer;
        string observerOrganization; // Organization represented by the observer
        
        uint256 timestamp;           // When the result was last updated
        bool finalized;              // Whether the result is finalized (all required signatures)
    }
    
    // Mapping from polling station ID to its election result
    mapping(string => ElectionResult) public electionResults;
    
    // Array to store all polling station IDs for iteration
    string[] public pollingStations;
    
    // Registered key persons who are authorized to sign results
    struct KeyPerson {
        string nationalId;
        string role;
        string pollingStation;
        string party;                // For party agents
        string organization;         // For observers
        bool isActive;
    }
    
    // Mapping from address to key person data
    mapping(address => KeyPerson) public keyPersons;
    
    // Events
    event ResultSubmitted(string pollingStationId, string electionId, uint256 totalVotes, uint256 timestamp);
    event ResultSigned(string pollingStationId, string role, address signer, uint256 timestamp);
    event ResultFinalized(string pollingStationId, string electionId, uint256 timestamp);
    
    /**
     * @dev Constructor sets the owner of the contract to the deployer
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Modifier to check if caller is the contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "ElectionResults: caller is not the owner");
        _;
    }
    
    /**
     * @dev Modifier to check if caller is registered as a specific role
     */
    modifier onlyRole(string memory role) {
        require(keyPersons[msg.sender].isActive, "ElectionResults: caller is not an active key person");
        require(keccak256(abi.encodePacked(keyPersons[msg.sender].role)) == keccak256(abi.encodePacked(role)), 
                "ElectionResults: caller does not have the required role");
        _;
    }
    
    /**
     * @dev Register a key person with the required role
     * @param person Address of the key person
     * @param nationalId National ID of the key person
     * @param role Role of the key person
     * @param pollingStation Polling station the key person is assigned to
     * @param party Political party (for party agents)
     * @param organization Observer organization (for observers)
     */
    function registerKeyPerson(
        address person, 
        string memory nationalId, 
        string memory role, 
        string memory pollingStation,
        string memory party,
        string memory organization
    ) public onlyOwner {
        keyPersons[person] = KeyPerson({
            nationalId: nationalId,
            role: role,
            pollingStation: pollingStation,
            party: party,
            organization: organization,
            isActive: true
        });
    }
    
    /**
     * @dev Deactivate a key person
     * @param person Address of the key person to deactivate
     */
    function deactivateKeyPerson(address person) public onlyOwner {
        require(keyPersons[person].isActive, "ElectionResults: person is already inactive");
        keyPersons[person].isActive = false;
    }
    
    /**
     * @dev Submit initial election results for a polling station
     * Only a Presiding Officer can submit initial results
     * @param pollingStationId ID of the polling station
     * @param electionId ID of the election
     * @param resultHash Hash of the complete result data
     * @param resultDataUrl URL or IPFS hash where full result data is stored
     * @param totalVotes Total number of votes cast
     * @param candidateIds Array of candidate IDs
     * @param votes Array of vote counts corresponding to candidate IDs
     */
    function submitResults(
        string memory pollingStationId,
        string memory electionId,
        string memory resultHash,
        string memory resultDataUrl,
        uint256 totalVotes,
        string[] memory candidateIds,
        uint256[] memory votes
    ) public onlyRole("Presiding Officer (PO)") {
        // Ensure arrays have same length
        require(candidateIds.length == votes.length, "ElectionResults: candidate IDs and votes arrays must have same length");
        
        // Check if the caller is assigned to this polling station
        require(
            keccak256(abi.encodePacked(keyPersons[msg.sender].pollingStation)) == 
            keccak256(abi.encodePacked(pollingStationId)),
            "ElectionResults: caller is not assigned to this polling station"
        );
        
        // Check if results for this polling station already exist
        bool isNew = bytes(electionResults[pollingStationId].resultHash).length == 0;
        
        // If this is a new polling station, add it to the array
        if (isNew) {
            pollingStations.push(pollingStationId);
        } else {
            // If updating existing results, ensure they are not finalized
            require(!electionResults[pollingStationId].finalized, 
                   "ElectionResults: cannot update finalized results");
            
            // Reset previous candidate votes mapping (done manually since we can't delete mappings)
            for (uint i = 0; i < electionResults[pollingStationId].candidateIds.length; i++) {
                string memory candidateId = electionResults[pollingStationId].candidateIds[i];
                electionResults[pollingStationId].candidateVotes[candidateId] = 0;
            }
            
            // Clear candidate IDs array
            delete electionResults[pollingStationId].candidateIds;
        }
        
        // Update or create the election result
        ElectionResult storage result = electionResults[pollingStationId];
        result.pollingStationId = pollingStationId;
        result.electionId = electionId;
        result.resultHash = resultHash;
        result.resultDataUrl = resultDataUrl;
        result.totalVotes = totalVotes;
        
        // Store candidate IDs
        for (uint i = 0; i < candidateIds.length; i++) {
            result.candidateIds.push(candidateIds[i]);
            result.candidateVotes[candidateIds[i]] = votes[i];
        }
        
        // Mark as signed by the Presiding Officer
        result.presidingOfficerSigned = true;
        result.presidingOfficer = msg.sender;
        
        // Update timestamp
        result.timestamp = block.timestamp;
        
        // Check if all required signatures are present and finalize if so
        _checkAndFinalizeResult(pollingStationId);
        
        emit ResultSubmitted(pollingStationId, electionId, totalVotes, block.timestamp);
        emit ResultSigned(pollingStationId, "Presiding Officer (PO)", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Sign election results as a Party Agent
     * @param pollingStationId ID of the polling station
     */
    function signAsPartyAgent(string memory pollingStationId) public onlyRole("Party Agents") {
        // Ensure results exist for this polling station
        require(bytes(electionResults[pollingStationId].resultHash).length > 0, 
                "ElectionResults: no results found for this polling station");
        
        // Check if the results are already finalized
        require(!electionResults[pollingStationId].finalized, 
                "ElectionResults: results are already finalized");
        
        // Check if the caller is assigned to this polling station
        require(
            keccak256(abi.encodePacked(keyPersons[msg.sender].pollingStation)) == 
            keccak256(abi.encodePacked(pollingStationId)),
            "ElectionResults: caller is not assigned to this polling station"
        );
        
        // Mark as signed by the Party Agent
        ElectionResult storage result = electionResults[pollingStationId];
        result.partyAgentSigned = true;
        result.partyAgent = msg.sender;
        result.partyAgentParty = keyPersons[msg.sender].party;
        
        // Update timestamp
        result.timestamp = block.timestamp;
        
        // Check if all required signatures are present and finalize if so
        _checkAndFinalizeResult(pollingStationId);
        
        emit ResultSigned(pollingStationId, "Party Agents", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Sign election results as an Observer
     * @param pollingStationId ID of the polling station
     */
    function signAsObserver(string memory pollingStationId) public onlyRole("Observers") {
        // Ensure results exist for this polling station
        require(bytes(electionResults[pollingStationId].resultHash).length > 0, 
                "ElectionResults: no results found for this polling station");
        
        // Check if the results are already finalized
        require(!electionResults[pollingStationId].finalized, 
                "ElectionResults: results are already finalized");
        
        // Check if the caller is assigned to this polling station
        require(
            keccak256(abi.encodePacked(keyPersons[msg.sender].pollingStation)) == 
            keccak256(abi.encodePacked(pollingStationId)),
            "ElectionResults: caller is not assigned to this polling station"
        );
        
        // Mark as signed by the Observer
        ElectionResult storage result = electionResults[pollingStationId];
        result.observerSigned = true;
        result.observer = msg.sender;
        result.observerOrganization = keyPersons[msg.sender].organization;
        
        // Update timestamp
        result.timestamp = block.timestamp;
        
        // Check if all required signatures are present and finalize if so
        _checkAndFinalizeResult(pollingStationId);
        
        emit ResultSigned(pollingStationId, "Observers", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Internal function to check if all required signatures are present and finalize the result
     * @param pollingStationId ID of the polling station
     */
    function _checkAndFinalizeResult(string memory pollingStationId) internal {
        ElectionResult storage result = electionResults[pollingStationId];
        
        // Check if all required signatures are present
        if (result.presidingOfficerSigned && result.partyAgentSigned && result.observerSigned) {
            result.finalized = true;
            emit ResultFinalized(pollingStationId, result.electionId, block.timestamp);
        }
    }
    
    /**
     * @dev Get the candidate votes for a specific polling station
     * @param pollingStationId ID of the polling station
     * @param candidateId ID of the candidate
     * @return Number of votes for the candidate
     */
    function getCandidateVotes(string memory pollingStationId, string memory candidateId) public view returns (uint256) {
        return electionResults[pollingStationId].candidateVotes[candidateId];
    }
    
    /**
     * @dev Get the list of candidates for a specific polling station
     * @param pollingStationId ID of the polling station
     * @return Array of candidate IDs
     */
    function getCandidates(string memory pollingStationId) public view returns (string[] memory) {
        return electionResults[pollingStationId].candidateIds;
    }
    
    /**
     * @dev Get the status of signatures for a specific polling station
     * @param pollingStationId ID of the polling station
     * @return presOfficerSigned Whether the Presiding Officer has signed
     * @return partyAgentSigned Whether a Party Agent has signed
     * @return observerSigned Whether an Observer has signed
     * @return isFinalized Whether the result is finalized
     */
    function getSignatureStatus(string memory pollingStationId) public view returns (
        bool presOfficerSigned,
        bool partyAgentSigned,
        bool observerSigned,
        bool isFinalized
    ) {
        ElectionResult storage result = electionResults[pollingStationId];
        return (
            result.presidingOfficerSigned,
            result.partyAgentSigned,
            result.observerSigned,
            result.finalized
        );
    }
    
    /**
     * @dev Get the signer details for a specific polling station
     * @param pollingStationId ID of the polling station
     * @return presOfficer Address of the Presiding Officer
     * @return partyAgent Address of the Party Agent
     * @return partyName Name of the party represented by the Party Agent
     * @return observer Address of the Observer
     * @return orgName Name of the organization represented by the Observer
     */
    function getSignerDetails(string memory pollingStationId) public view returns (
        address presOfficer,
        address partyAgent,
        string memory partyName,
        address observer,
        string memory orgName
    ) {
        ElectionResult storage result = electionResults[pollingStationId];
        return (
            result.presidingOfficer,
            result.partyAgent,
            result.partyAgentParty,
            result.observer,
            result.observerOrganization
        );
    }
    
    /**
     * @dev Get the total number of polling stations
     * @return Number of polling stations
     */
    function getPollingStationCount() public view returns (uint256) {
        return pollingStations.length;
    }
    
    /**
     * @dev Get the basic details of an election result
     * @param pollingStationId ID of the polling station
     * @return electionId ID of the election
     * @return resultHash Hash of the result data
     * @return resultUrl URL or IPFS hash of the full result data
     * @return totalVotes Total number of votes cast
     * @return timestamp When the result was last updated
     * @return finalized Whether the result is finalized
     */
    function getElectionResultDetails(string memory pollingStationId) public view returns (
        string memory electionId,
        string memory resultHash,
        string memory resultUrl,
        uint256 totalVotes,
        uint256 timestamp,
        bool finalized
    ) {
        ElectionResult storage result = electionResults[pollingStationId];
        return (
            result.electionId,
            result.resultHash,
            result.resultDataUrl,
            result.totalVotes,
            result.timestamp,
            result.finalized
        );
    }
}
