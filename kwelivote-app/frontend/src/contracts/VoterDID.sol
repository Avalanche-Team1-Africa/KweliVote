// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VoterDID
 * @dev Store and manage voter DIDs on an Avalanche subnet blockchain
 */
contract VoterDID {
    address public admin;
    
    // Mapping from nationalId to DID
    mapping(string => string) private voterDIDs;
    
    // Mapping to track registered voters
    mapping(string => bool) private registeredVoters;
    
    // Array of all national IDs for enumeration
    string[] private allNationalIds;
    
    // Events
    event VoterRegistered(string nationalId, string did);
    event VoterDIDUpdated(string nationalId, string oldDid, string newDid);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    /**
     * @dev Constructor - set deployer as admin
     */
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Register a new voter with their DID
     * @param did The W3C compliant DID (did:key:...)
     * @param nationalId The voter's national ID
     */
    function registerVoter(string memory did, string memory nationalId) public onlyAdmin {
        require(bytes(nationalId).length > 0, "National ID cannot be empty");
        require(bytes(did).length > 0, "DID cannot be empty");
        
        if (registeredVoters[nationalId]) {
            // Voter exists, update DID
            string memory oldDid = voterDIDs[nationalId];
            voterDIDs[nationalId] = did;
            emit VoterDIDUpdated(nationalId, oldDid, did);
        } else {
            // New voter
            voterDIDs[nationalId] = did;
            registeredVoters[nationalId] = true;
            allNationalIds.push(nationalId);
            emit VoterRegistered(nationalId, did);
        }
    }
    
    /**
     * @dev Get a voter's DID by national ID
     * @param nationalId The voter's national ID
     * @return The voter's DID or empty string if not found
     */
    function getVoterDID(string memory nationalId) public view returns (string memory) {
        return voterDIDs[nationalId];
    }
    
    /**
     * @dev Check if a voter is registered
     * @param nationalId The voter's national ID
     * @return True if voter is registered, false otherwise
     */
    function isVoterRegistered(string memory nationalId) public view returns (bool) {
        return registeredVoters[nationalId];
    }
    
    /**
     * @dev Get the total number of registered voters
     * @return The total number of registered voters
     */
    function getTotalVoters() public view returns (uint256) {
        return allNationalIds.length;
    }
    
    /**
     * @dev Get a voter's national ID by index
     * @param index The index of the voter
     * @return The voter's national ID
     */
    function getNationalIdByIndex(uint256 index) public view returns (string memory) {
        require(index < allNationalIds.length, "Index out of bounds");
        return allNationalIds[index];
    }
    
    /**
     * @dev Transfer admin rights to a new address
     * @param newAdmin The address of the new admin
     */
    function transferAdmin(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "New admin cannot be the zero address");
        admin = newAdmin;
    }
    
    /**
     * @dev Verify if a DID matches the one stored for a given national ID
     * @param nationalId The voter's national ID
     * @param did The DID to verify
     * @return True if the DID matches, false otherwise
     */
    function verifyDID(string memory nationalId, string memory did) public view returns (bool) {
        string memory storedDid = voterDIDs[nationalId];
        return keccak256(abi.encodePacked(storedDid)) == keccak256(abi.encodePacked(did));
    }
}