// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DAOFactory
 * @notice Factory for creating OmniDAO instances
 * @dev Uses minimal proxy pattern for gas-efficient DAO creation
 */
contract DAOFactory is Ownable {
    using Clones for address;

    // Implementation address for OmniDAO
    address public immutable daoImplementation;

    // Events
    event DAOCreated(
        address indexed dao,
        address indexed creator,
        string name
    );

    /**
     * @notice Constructor
     * @param _daoImplementation The implementation address for OmniDAO
     */
    constructor(address _daoImplementation) {
        require(_daoImplementation != address(0), "invalid implementation");
        daoImplementation = _daoImplementation;
    }

    /**
     * @notice Creates a new DAO
     * @param name The name of the DAO
     * @param token The governance token address
     * @param quorumPct The quorum percentage
     * @return The address of the new DAO
     */
    function createDAO(
        string memory name,
        address token,
        uint256 quorumPct
    ) external returns (address) {
        require(bytes(name).length > 0, "invalid name");
        require(token != address(0), "invalid token");
        require(quorumPct > 0 && quorumPct <= 100, "invalid quorum");

        address dao = daoImplementation.clone();
        emit DAOCreated(dao, msg.sender, name);

        // Initialize the DAO
        (bool success, ) = dao.call(
            abi.encodeWithSignature(
                "initialize(address,address,uint256,string)",
                msg.sender,
                token,
                quorumPct,
                name
            )
        );
        require(success, "initialization failed");

        return dao;
    }

    /**
     * @notice Predicts the address of a DAO that would be created
     * @param salt The salt for deterministic address calculation
     * @return The predicted DAO address
     */
    function predictDAOAddress(bytes32 salt) external view returns (address) {
        return daoImplementation.predictDeterministicAddress(salt);
    }
} 