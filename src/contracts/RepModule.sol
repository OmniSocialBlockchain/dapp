// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title RepModule
 * @notice Domain-aware, decaying reputation system
 * @dev Tracks user merit per domain with automatic decay
 */
contract RepModule is AccessControl {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using Math for uint256;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GRANTER_ROLE = keccak256("GRANTER_ROLE");

    // Domain definitions
    bytes32 public constant DOMAIN_CREATION = keccak256("creation");
    bytes32 public constant DOMAIN_GOVERNANCE = keccak256("governance");
    bytes32 public constant DOMAIN_MODERATION = keccak256("moderation");

    // Reputation configuration
    struct RepConfig {
        uint256 decayRate; // Points decayed per second
        uint256 maxPoints; // Maximum points per domain
        uint256 minPoints; // Minimum points per domain
    }

    // User reputation per domain
    struct UserRep {
        uint256 points;
        uint256 lastUpdate;
        uint256 lastGrant;
    }

    // Domain configurations
    mapping(bytes32 => RepConfig) private _domainConfigs;

    // User reputation tracking
    mapping(address => mapping(bytes32 => UserRep)) private _userReps;

    // Events
    event ReputationGranted(
        address indexed user,
        bytes32 indexed domain,
        uint256 amount,
        uint256 newTotal
    );
    event ReputationRevoked(
        address indexed user,
        bytes32 indexed domain,
        uint256 amount,
        uint256 newTotal
    );
    event DomainConfigUpdated(
        bytes32 indexed domain,
        uint256 decayRate,
        uint256 maxPoints,
        uint256 minPoints
    );

    /**
     * @notice Constructor
     * @param admin The admin address
     */
    constructor(address admin) {
        _setupRole(ADMIN_ROLE, admin);
        _setupRole(GRANTER_ROLE, admin);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(GRANTER_ROLE, ADMIN_ROLE);

        // Initialize default domain configurations
        _domainConfigs[DOMAIN_CREATION] = RepConfig({
            decayRate: 1, // 1 point per second
            maxPoints: 1000,
            minPoints: 0
        });
        _domainConfigs[DOMAIN_GOVERNANCE] = RepConfig({
            decayRate: 2, // 2 points per second
            maxPoints: 2000,
            minPoints: 0
        });
        _domainConfigs[DOMAIN_MODERATION] = RepConfig({
            decayRate: 3, // 3 points per second
            maxPoints: 3000,
            minPoints: 0
        });
    }

    /**
     * @notice Grants reputation to a user in a domain
     * @param user The user address
     * @param domain The domain identifier
     * @param amount The amount of reputation to grant
     */
    function grant(
        address user,
        bytes32 domain,
        uint256 amount
    ) external onlyRole(GRANTER_ROLE) {
        require(user != address(0), "invalid user");
        require(amount > 0, "invalid amount");
        require(_domainConfigs[domain].decayRate > 0, "invalid domain");

        UserRep storage rep = _userReps[user][domain];
        uint256 currentPoints = _getCurrentPoints(user, domain);
        uint256 newPoints = currentPoints + amount;

        // Apply domain limits
        RepConfig storage config = _domainConfigs[domain];
        newPoints = newPoints.min(config.maxPoints);

        rep.points = newPoints;
        rep.lastUpdate = block.timestamp;
        rep.lastGrant = block.timestamp;

        emit ReputationGranted(user, domain, amount, newPoints);
    }

    /**
     * @notice Revokes reputation from a user in a domain
     * @param user The user address
     * @param domain The domain identifier
     * @param amount The amount of reputation to revoke
     */
    function revoke(
        address user,
        bytes32 domain,
        uint256 amount
    ) external onlyRole(GRANTER_ROLE) {
        require(user != address(0), "invalid user");
        require(amount > 0, "invalid amount");
        require(_domainConfigs[domain].decayRate > 0, "invalid domain");

        UserRep storage rep = _userReps[user][domain];
        uint256 currentPoints = _getCurrentPoints(user, domain);
        uint256 newPoints = currentPoints > amount ? currentPoints - amount : 0;

        // Apply domain limits
        RepConfig storage config = _domainConfigs[domain];
        newPoints = newPoints.max(config.minPoints);

        rep.points = newPoints;
        rep.lastUpdate = block.timestamp;

        emit ReputationRevoked(user, domain, amount, newPoints);
    }

    /**
     * @notice Gets the current reputation of a user in a domain
     * @param user The user address
     * @param domain The domain identifier
     * @return The current reputation points
     */
    function getReputation(
        address user,
        bytes32 domain
    ) external view returns (uint256) {
        require(user != address(0), "invalid user");
        require(_domainConfigs[domain].decayRate > 0, "invalid domain");
        return _getCurrentPoints(user, domain);
    }

    /**
     * @notice Updates the configuration for a domain
     * @param domain The domain identifier
     * @param decayRate The new decay rate
     * @param maxPoints The new maximum points
     * @param minPoints The new minimum points
     */
    function updateDomainConfig(
        bytes32 domain,
        uint256 decayRate,
        uint256 maxPoints,
        uint256 minPoints
    ) external onlyRole(ADMIN_ROLE) {
        require(decayRate > 0, "invalid decay rate");
        require(maxPoints > minPoints, "invalid point range");

        _domainConfigs[domain] = RepConfig({
            decayRate: decayRate,
            maxPoints: maxPoints,
            minPoints: minPoints
        });

        emit DomainConfigUpdated(domain, decayRate, maxPoints, minPoints);
    }

    /**
     * @notice Gets the current points for a user in a domain
     * @param user The user address
     * @param domain The domain identifier
     * @return The current points
     */
    function _getCurrentPoints(
        address user,
        bytes32 domain
    ) private view returns (uint256) {
        UserRep storage rep = _userReps[user][domain];
        if (rep.points == 0) return 0;

        uint256 timeElapsed = block.timestamp - rep.lastUpdate;
        uint256 decayedPoints = timeElapsed * _domainConfigs[domain].decayRate;

        if (decayedPoints >= rep.points) {
            return _domainConfigs[domain].minPoints;
        }

        return rep.points - decayedPoints;
    }

    /**
     * @notice Gets the time until next decay
     * @param user The user address
     * @param domain The domain identifier
     * @return The time until next decay in seconds
     */
    function getTimeUntilDecay(
        address user,
        bytes32 domain
    ) external view returns (uint256) {
        require(user != address(0), "invalid user");
        require(_domainConfigs[domain].decayRate > 0, "invalid domain");

        UserRep storage rep = _userReps[user][domain];
        if (rep.points == 0) return 0;

        uint256 timeElapsed = block.timestamp - rep.lastUpdate;
        uint256 decayedPoints = timeElapsed * _domainConfigs[domain].decayRate;

        if (decayedPoints >= rep.points) {
            return 0;
        }

        return (rep.points - decayedPoints) / _domainConfigs[domain].decayRate;
    }

    /**
     * @notice Gets the domain configuration
     * @param domain The domain identifier
     * @return The domain configuration
     */
    function getDomainConfig(
        bytes32 domain
    ) external view returns (RepConfig memory) {
        return _domainConfigs[domain];
    }

    /**
     * @notice Gets the user's last grant time in a domain
     * @param user The user address
     * @param domain The domain identifier
     * @return The last grant timestamp
     */
    function getLastGrantTime(
        address user,
        bytes32 domain
    ) external view returns (uint256) {
        return _userReps[user][domain].lastGrant;
    }
} 