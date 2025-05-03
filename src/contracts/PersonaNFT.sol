// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PersonaNFT
 * @notice ERC-721 identity shards with IPFS/Arweave metadata
 * @dev Implements ERC-721 with role-based access control for persona creation
 */
contract PersonaNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Token counter
    Counters.Counter private _tokenIdCounter;

    // Base URI for token metadata
    string private _baseTokenURI;

    // Token metadata
    struct PersonaMetadata {
        string username;
        string label;
        string tokenURI;
        bool isPublic;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    // Token ID to metadata mapping
    mapping(uint256 => PersonaMetadata) private _personaMetadata;

    // Events
    event PersonaCreated(
        uint256 indexed tokenId,
        address indexed recipient,
        string username,
        string label,
        string tokenURI,
        bool isPublic
    );
    event PersonaUpdated(
        uint256 indexed tokenId,
        string username,
        string label,
        string tokenURI,
        bool isPublic
    );
    event BaseURIUpdated(string newBaseURI);

    /**
     * @notice Constructor
     * @param name The token name
     * @param symbol The token symbol
     * @param baseTokenURI The base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
        
        // Setup roles
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
    }

    /**
     * @notice Creates a new persona
     * @param recipient The recipient address
     * @param username The persona username
     * @param label The persona label
     * @param tokenURI The token metadata URI
     * @param isPublic Whether the persona is public
     * @return The new token ID
     */
    function createPersona(
        address recipient,
        string memory username,
        string memory label,
        string memory tokenURI,
        bool isPublic
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(recipient != address(0), "invalid recipient");
        require(bytes(username).length > 0, "invalid username");
        require(bytes(label).length > 0, "invalid label");
        require(bytes(tokenURI).length > 0, "invalid token URI");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(recipient, tokenId);

        _personaMetadata[tokenId] = PersonaMetadata({
            username: username,
            label: label,
            tokenURI: tokenURI,
            isPublic: isPublic,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        emit PersonaCreated(tokenId, recipient, username, label, tokenURI, isPublic);

        return tokenId;
    }

    /**
     * @notice Updates persona metadata
     * @param tokenId The token ID
     * @param username The new username
     * @param label The new label
     * @param tokenURI The new token metadata URI
     * @param isPublic Whether the persona is public
     */
    function updatePersona(
        uint256 tokenId,
        string memory username,
        string memory label,
        string memory tokenURI,
        bool isPublic
    ) external {
        require(_exists(tokenId), "token does not exist");
        require(_isApprovedOrOwner(msg.sender, tokenId), "not owner or approved");
        require(bytes(username).length > 0, "invalid username");
        require(bytes(label).length > 0, "invalid label");
        require(bytes(tokenURI).length > 0, "invalid token URI");

        PersonaMetadata storage metadata = _personaMetadata[tokenId];
        metadata.username = username;
        metadata.label = label;
        metadata.tokenURI = tokenURI;
        metadata.isPublic = isPublic;
        metadata.lastUpdated = block.timestamp;

        emit PersonaUpdated(tokenId, username, label, tokenURI, isPublic);
    }

    /**
     * @notice Sets the base URI for token metadata
     * @param baseTokenURI The new base URI
     */
    function setBaseURI(string memory baseTokenURI) external onlyRole(ADMIN_ROLE) {
        _baseTokenURI = baseTokenURI;
        emit BaseURIUpdated(baseTokenURI);
    }

    /**
     * @notice Gets persona metadata
     * @param tokenId The token ID
     * @return The persona metadata
     */
    function getPersonaMetadata(uint256 tokenId) external view returns (
        string memory username,
        string memory label,
        string memory tokenURI,
        bool isPublic,
        uint256 createdAt,
        uint256 lastUpdated
    ) {
        require(_exists(tokenId), "token does not exist");
        PersonaMetadata storage metadata = _personaMetadata[tokenId];
        return (
            metadata.username,
            metadata.label,
            metadata.tokenURI,
            metadata.isPublic,
            metadata.createdAt,
            metadata.lastUpdated
        );
    }

    /**
     * @notice Checks if a persona is public
     * @param tokenId The token ID
     * @return True if the persona is public
     */
    function isPublic(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "token does not exist");
        return _personaMetadata[tokenId].isPublic;
    }

    /**
     * @notice Gets the total number of personas
     * @return The number of personas
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice Gets the token URI
     * @param tokenId The token ID
     * @return The token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "token does not exist");
        return _personaMetadata[tokenId].tokenURI;
    }

    /**
     * @notice Checks if a token exists
     * @param tokenId The token ID
     * @return True if the token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @notice Supports interface
     * @param interfaceId The interface ID
     * @return True if the interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 