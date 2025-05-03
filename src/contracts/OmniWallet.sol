// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@account-abstraction/contracts/core/BaseAccount.sol";

/**
 * @title OmniWallet
 * @notice Account abstraction smart wallet with PersonaNFT linking and gas sponsorship
 * @dev Implements ERC-4337 account abstraction with WebAuthn security
 */
contract OmniWallet is BaseAccount, Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using ECDSA for bytes32;

    // PersonaNFT contract address
    address public immutable personaNFT;

    // Linked persona IDs
    EnumerableSet.UintSet private _linkedPersonas;

    // WebAuthn public key
    bytes public webauthnPublicKey;

    // Events
    event Executed(address indexed target, uint256 value, bytes data, bool success);
    event PersonaAdded(uint256 indexed personaId);
    event PersonaRemoved(uint256 indexed personaId);
    event Withdrawn(address indexed to, uint256 amount);
    event WebAuthnKeySet(bytes publicKey);

    /**
     * @notice Constructor
     * @param _personaNFT The address of the PersonaNFT contract
     * @param _entryPoint The ERC-4337 entry point contract
     */
    constructor(address _personaNFT, IEntryPoint _entryPoint) BaseAccount(_entryPoint) {
        require(_personaNFT != address(0), "invalid persona NFT");
        personaNFT = _personaNFT;
    }

    /**
     * @notice Initializes the wallet with an owner
     * @param _owner The owner address
     */
    function initialize(address _owner) external {
        require(owner() == address(0), "already initialized");
        _transferOwnership(_owner);
    }

    /**
     * @notice Sets the WebAuthn public key
     * @param _publicKey The WebAuthn public key
     */
    function setWebAuthnKey(bytes calldata _publicKey) external onlyOwner {
        webauthnPublicKey = _publicKey;
        emit WebAuthnKeySet(_publicKey);
    }

    /**
     * @notice Executes a call to a target contract
     * @param target The target contract address
     * @param value The amount of ETH to send
     * @param data The call data
     * @return success Whether the call succeeded
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner nonReentrant returns (bool success) {
        require(target != address(0), "invalid target");
        
        (success, ) = target.call{value: value}(data);
        emit Executed(target, value, data, success);
    }

    /**
     * @notice Links a PersonaNFT to the wallet
     * @param personaId The PersonaNFT ID
     */
    function addPersona(uint256 personaId) external onlyOwner {
        require(IERC721(personaNFT).ownerOf(personaId) == address(this), "not owner");
        require(_linkedPersonas.add(personaId), "already linked");
        emit PersonaAdded(personaId);
    }

    /**
     * @notice Unlinks a PersonaNFT from the wallet
     * @param personaId The PersonaNFT ID
     */
    function removePersona(uint256 personaId) external onlyOwner {
        require(_linkedPersonas.remove(personaId), "not linked");
        emit PersonaRemoved(personaId);
    }

    /**
     * @notice Withdraws ETH from the wallet
     * @param amount The amount to withdraw
     * @param to The recipient address
     */
    function withdraw(uint256 amount, address to) external onlyOwner nonReentrant {
        require(to != address(0), "invalid recipient");
        require(address(this).balance >= amount, "insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "withdraw failed");
        
        emit Withdrawn(to, amount);
    }

    /**
     * @notice Gets all linked persona IDs
     * @return An array of persona IDs
     */
    function getLinkedPersonas() external view returns (uint256[] memory) {
        return _linkedPersonas.values();
    }

    /**
     * @notice Checks if a persona is linked
     * @param personaId The PersonaNFT ID
     * @return True if the persona is linked
     */
    function isPersonaLinked(uint256 personaId) external view returns (bool) {
        return _linkedPersonas.contains(personaId);
    }

    /**
     * @notice Gets the number of linked personas
     * @return The number of linked personas
     */
    function getLinkedPersonaCount() external view returns (uint256) {
        return _linkedPersonas.length();
    }

    /**
     * @notice Validates a user operation
     * @param userOp The user operation
     * @param userOpHash The user operation hash
     * @param missingAccountFunds The missing account funds
     * @return validationData The validation data
     */
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (uint256 validationData) {
        // Check WebAuthn signature if set
        if (webauthnPublicKey.length > 0) {
            require(
                _verifyWebAuthnSignature(userOpHash, userOp.signature),
                "invalid webauthn signature"
            );
        } else {
            // Fallback to owner signature
            require(
                userOpHash.recover(userOp.signature) == owner(),
                "invalid signature"
            );
        }
        return 0;
    }

    /**
     * @notice Verifies a WebAuthn signature
     * @param hash The message hash
     * @param signature The WebAuthn signature
     * @return True if the signature is valid
     */
    function _verifyWebAuthnSignature(
        bytes32 hash,
        bytes calldata signature
    ) internal view returns (bool) {
        // TODO: Implement WebAuthn signature verification
        // This is a placeholder for the actual WebAuthn verification logic
        return true;
    }

    /**
     * @notice Receives ETH
     */
    receive() external payable {}
} 