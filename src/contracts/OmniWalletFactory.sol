// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./OmniWallet.sol";

/**
 * @title OmniWalletFactory
 * @notice Factory contract for creating OmniWallet instances using minimal proxies
 * @dev Handles one-click onboarding by cloning a minimal proxy of the OmniWallet implementation
 */
contract OmniWalletFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using Clones for address;

    // The implementation address to clone
    address public immutable walletImplementation;

    // Registry of all created wallets
    EnumerableSet.AddressSet private _allWallets;

    // Events
    event WalletCreated(address indexed wallet, address indexed owner);
    event ImplementationUpdated(address indexed newImplementation);

    /**
     * @notice Constructor
     * @param _walletImplementation The address of the OmniWallet implementation to clone
     */
    constructor(address _walletImplementation) {
        require(_walletImplementation != address(0), "invalid implementation");
        walletImplementation = _walletImplementation;
    }

    /**
     * @notice Creates a new wallet for the caller
     * @return The address of the newly created wallet
     */
    function createWallet() external returns (address) {
        // Clone the implementation
        address wallet = walletImplementation.clone();
        
        // Initialize the wallet
        OmniWallet(wallet).initialize(msg.sender);
        
        // Add to registry
        _allWallets.add(wallet);
        
        // Emit event
        emit WalletCreated(wallet, msg.sender);
        
        return wallet;
    }

    /**
     * @notice Gets the total number of wallets created
     * @return The number of wallets
     */
    function getWalletCount() external view returns (uint256) {
        return _allWallets.length();
    }

    /**
     * @notice Gets all wallet addresses
     * @return An array of all wallet addresses
     */
    function getAllWallets() external view returns (address[] memory) {
        return _allWallets.values();
    }

    /**
     * @notice Gets wallet addresses with pagination
     * @param start The starting index
     * @param count The number of wallets to return
     * @return An array of wallet addresses
     */
    function getWallets(uint256 start, uint256 count) external view returns (address[] memory) {
        uint256 total = _allWallets.length();
        require(start < total, "start out of bounds");
        
        uint256 end = start + count;
        if (end > total) {
            end = total;
        }
        
        address[] memory wallets = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            wallets[i - start] = _allWallets.at(i);
        }
        
        return wallets;
    }

    /**
     * @notice Checks if an address is a wallet created by this factory
     * @param wallet The address to check
     * @return True if the address is a wallet created by this factory
     */
    function isWallet(address wallet) external view returns (bool) {
        return _allWallets.contains(wallet);
    }

    /**
     * @notice Gets the owner of a wallet
     * @param wallet The wallet address
     * @return The owner address
     */
    function getWalletOwner(address wallet) external view returns (address) {
        require(_allWallets.contains(wallet), "not a wallet");
        return OmniWallet(wallet).owner();
    }

    /**
     * @notice Gets the implementation address
     * @return The implementation address
     */
    function getImplementation() external view returns (address) {
        return walletImplementation;
    }
} 