// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VoterDID
 * @dev Smart contract for storing and verifying voter DIDs (Decentralized Identifiers)
 * This contract allows authorized parties to register and verify voter DIDs
 * for the KweliVote electronic voting system.
 */
contract VoterDID {
    // Contract owner (typically the election commission or authorized entity)
    address public owner;
    
    // Mapping from national ID to DID
    mapping(string => string) public voterDIDs;
    
    // Event emitted when a new DID is registered
    event DIDRegistered(string indexed nationalId, string did);
    
    /**
     * @dev Constructor sets the owner of the contract to the deployer
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Register a new DID for a voter with the given national ID
     * @param nationalId The national ID of the voter
     * @param did The DID to associate with this voter
     */
    function registerDID(string memory nationalId, string memory did) public {
        // Store the DID for the national ID
        voterDIDs[nationalId] = did;
        
        // Emit an event for the registration
        emit DIDRegistered(nationalId, did);
    }
    
    /**
     * @dev Get the DID associated with a specific national ID
     * @param nationalId The national ID to look up
     * @return The DID associated with the provided national ID
     */
    function getDID(string memory nationalId) public view returns (string memory) {
        return voterDIDs[nationalId];
    }
}