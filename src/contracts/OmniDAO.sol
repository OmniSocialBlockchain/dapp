// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./RepModule.sol";

/**
 * @title OmniDAO
 * @notice Governance contract with support for ERC-20, ERC-721, and reputation-based voting
 * @dev Extends OpenZeppelin's Governor with additional voting mechanisms
 */
contract OmniDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    AccessControl,
    ReentrancyGuard
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    // Voting token types
    enum VotingTokenType {
        ERC20,
        ERC721,
        REPUTATION
    }

    // Voting configuration
    struct VotingConfig {
        VotingTokenType tokenType;
        address tokenAddress;
        bytes32 domain; // For reputation voting
    }

    // Proposal tracking
    Counters.Counter private _proposalId;
    mapping(uint256 => VotingConfig) private _proposalVotingConfig;

    // Treasury Management
    struct TokenConfig {
        bool isWhitelisted;
        uint256 dailySpendLimit;
        uint256 lastSpendTimestamp;
        uint256 spentToday;
        uint256 requiredSignatures;
        mapping(address => bool) signers;
    }

    struct SpendingCategory {
        string name;
        uint256 budget;
        uint256 spent;
        uint256 requiredSignatures;
        mapping(address => bool) authorizedSigners;
    }

    struct BudgetTransfer {
        address fromCategory;
        address toCategory;
        uint256 amount;
        uint256 deadline;
        mapping(address => bool) approvals;
        uint256 approvalCount;
        bool executed;
    }

    struct SpendingProposal {
        address proposer;
        address token;
        uint256 amount;
        bytes32 categoryId;
        string description;
        uint256 createdAt;
        uint256 deadline;
        mapping(address => bool) approvals;
        uint256 approvalCount;
        bool executed;
    }

    mapping(address => uint256) public tokenBalances;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(bytes32 => SpendingCategory) public spendingCategories;
    mapping(bytes32 => mapping(address => bool)) public pendingSignatures;
    mapping(uint256 => SpendingProposal) public spendingProposals;
    mapping(uint256 => BudgetTransfer) public budgetTransfers;
    EnumerableSet.AddressSet private whitelistedTokens;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public spendingProposalCount;
    uint256 public budgetTransferCount;
    
    // Reputation Management
    struct ReputationConfig {
        bool isActive;
        uint256 decayRate; // per day in basis points
        uint256 lastUpdate;
        uint256 baseScore;
        bool allowDelegation;
        bool allowStaking;
        uint256 minStakeAmount;
        uint256 maxStakeAmount;
        uint256 stakeLockPeriod;
        bool allowPooling;
        uint256 poolFee; // in basis points
    }

    struct Delegation {
        address delegate;
        uint256 amount;
        uint256 until;
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockUntil;
        uint256 multiplier; // in basis points
    }

    struct ReputationPool {
        uint256 totalStaked;
        uint256 totalRewards;
        uint256 lastRewardUpdate;
        mapping(address => uint256) userStakes;
        mapping(address => uint256) userRewards;
    }

    struct SlashingCondition {
        bool isActive;
        uint256 slashingRate; // in basis points
        uint256 gracePeriod;
        mapping(address => uint256) lastViolation;
    }

    address public repModule;
    bool public useReputationVoting;
    mapping(address => mapping(string => ReputationConfig)) public reputationConfigs;
    mapping(address => mapping(string => uint256)) public reputationScores;
    mapping(address => mapping(string => Delegation)) public reputationDelegations;
    mapping(address => mapping(string => Stake)) public reputationStakes;
    mapping(string => ReputationPool) public reputationPools;
    mapping(string => SlashingCondition) public slashingConditions;
    mapping(string => bool) public activeDomains;
    
    // Emergency Proposals
    struct EmergencyConfig {
        uint256 threshold;
        uint256 timeLimit; // in blocks
        bool hasVeto;
        address vetoAddress;
        uint256 committeeThreshold;
        mapping(address => bool) committeeMembers;
    }

    struct CommitteeRole {
        string name;
        uint256 weight;
        bool canVeto;
        bool canPropose;
        string[] parentRoles;
        string[] childRoles;
        mapping(address => bool) members;
    }

    struct EmergencyCommittee {
        address[] members;
        uint256 requiredApprovals;
        mapping(address => bool) hasApproved;
        uint256 approvals;
        mapping(string => CommitteeRole) roles;
    }

    mapping(uint256 => bool) public isEmergencyProposal;
    mapping(uint256 => uint256) public emergencyVotes;
    mapping(uint256 => uint256) public emergencyProposalTimestamps;
    mapping(uint256 => EmergencyCommittee) public emergencyCommittees;
    EmergencyConfig public emergencyConfig;
    mapping(uint256 => bool) public vetoedProposals;
    
    // Events
    event TokenDeposited(address indexed token, address indexed from, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event TokenWhitelisted(address indexed token, uint256 dailyLimit);
    event TokenRemoved(address indexed token);
    event DailySpendLimitUpdated(address indexed token, uint256 newLimit);
    event SignerAdded(address indexed token, address indexed signer);
    event SignerRemoved(address indexed token, address indexed signer);
    event SpendingCategoryCreated(bytes32 indexed categoryId, string name, uint256 budget);
    event SpendingCategoryUpdated(bytes32 indexed categoryId, uint256 newBudget);
    event SignatureAdded(bytes32 indexed categoryId, address indexed signer);
    event SpendingProposalCreated(uint256 indexed proposalId, address indexed proposer, address token, uint256 amount);
    event SpendingProposalApproved(uint256 indexed proposalId, address indexed approver);
    event SpendingProposalExecuted(uint256 indexed proposalId);
    event BudgetTransferCreated(uint256 indexed transferId, bytes32 fromCategory, bytes32 toCategory, uint256 amount);
    event BudgetTransferApproved(uint256 indexed transferId, address indexed approver);
    event BudgetTransferExecuted(uint256 indexed transferId);
    event EmergencyProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event EmergencyProposalExecuted(uint256 indexed proposalId);
    event EmergencyProposalVetoed(uint256 indexed proposalId, address indexed vetoer);
    event CommitteeMemberAdded(address indexed member, string indexed role);
    event CommitteeMemberRemoved(address indexed member, string indexed role);
    event CommitteeApprovalAdded(uint256 indexed proposalId, address indexed member);
    event ReputationVotingEnabled(bool enabled);
    event ReputationModuleSet(address indexed module);
    event ReputationDomainAdded(string indexed domain, uint256 decayRate);
    event ReputationDomainRemoved(string indexed domain);
    event ReputationScoreUpdated(address indexed account, string indexed domain, uint256 newScore);
    event ReputationDelegated(address indexed from, address indexed to, string indexed domain, uint256 amount, uint256 until);
    event ReputationUndelegated(address indexed from, address indexed to, string indexed domain);
    event ReputationStaked(address indexed staker, string indexed domain, uint256 amount, uint256 multiplier);
    event ReputationUnstaked(address indexed staker, string indexed domain, uint256 amount);
    event ReputationPooled(address indexed staker, string indexed domain, uint256 amount);
    event ReputationUnpooled(address indexed staker, string indexed domain, uint256 amount);
    event ReputationSlashed(address indexed account, string indexed domain, uint256 amount);
    event EmergencyConfigUpdated(uint256 threshold, uint256 timeLimit, bool hasVeto, address vetoAddress);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        VotingConfig votingConfig
    );

    /**
     * @notice Constructor
     * @param name The name of the DAO
     * @param token The governance token address
     * @param quorumPct The quorum percentage
     * @param timelock The timelock controller address
     * @param initialDelay The initial delay for proposals
     * @param votingPeriod The voting period in blocks
     * @param votingDelay The voting delay in blocks
     */
    constructor(
        string memory name,
        address token,
        uint256 quorumPct,
        address timelock,
        uint256 initialDelay,
        uint256 votingPeriod,
        uint256 votingDelay
    )
        Governor(name)
        GovernorSettings(votingDelay, votingPeriod, 0)
        GovernorVotes(IVotes(token))
        GovernorVotesQuorumFraction(quorumPct)
        GovernorTimelockControl(ITimelock(timelock))
    {
        _setupRole(PROPOSER_ROLE, msg.sender);
        _setupRole(EXECUTOR_ROLE, msg.sender);
        _setupRole(CANCELLER_ROLE, msg.sender);
        _setRoleAdmin(PROPOSER_ROLE, PROPOSER_ROLE);
        _setRoleAdmin(EXECUTOR_ROLE, PROPOSER_ROLE);
        _setRoleAdmin(CANCELLER_ROLE, PROPOSER_ROLE);
        emergencyConfig = EmergencyConfig({
            threshold: 75, // 75% of total voting power required
            timeLimit: 1000, // ~4 hours at 15s/block
            hasVeto: true,
            vetoAddress: address(0),
            committeeThreshold: 3 // Minimum committee members required
        });
    }

    /**
     * @notice Initializes the DAO
     * @param admin The admin address
     * @param token The governance token address
     * @param quorumPct The quorum percentage
     * @param name The name of the DAO
     */
    function initialize(
        address admin,
        address token,
        uint256 quorumPct,
        string memory name
    ) external {
        require(admin != address(0), "invalid admin");
        require(token != address(0), "invalid token");
        require(quorumPct > 0 && quorumPct <= 100, "invalid quorum");

        _setupRole(PROPOSER_ROLE, admin);
        _setupRole(EXECUTOR_ROLE, admin);
        _setupRole(CANCELLER_ROLE, admin);
    }

    /**
     * @notice Creates a new proposal
     * @param targets The target addresses
     * @param values The ETH values
     * @param calldatas The calldata arrays
     * @param description The proposal description
     * @param votingConfig The voting configuration
     * @return The proposal ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        VotingConfig memory votingConfig
    ) public onlyRole(PROPOSER_ROLE) returns (uint256) {
        require(targets.length == values.length, "length mismatch");
        require(targets.length == calldatas.length, "length mismatch");
        require(targets.length > 0, "empty proposal");

        uint256 proposalId = _proposalId.current();
        _proposalId.increment();

        _proposalVotingConfig[proposalId] = votingConfig;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            description,
            votingConfig
        );

        return proposalId;
    }

    /**
     * @notice Gets the voting power of an account
     * @param account The account address
     * @param proposalId The proposal ID
     * @return The voting power
     */
    function _getVotes(
        address account,
        uint256 proposalId,
        bytes memory /*params*/
    ) internal view override returns (uint256) {
        VotingConfig memory config = _proposalVotingConfig[proposalId];

        if (config.tokenType == VotingTokenType.ERC20) {
            return IERC20(config.tokenAddress).balanceOf(account);
        } else if (config.tokenType == VotingTokenType.ERC721) {
            return IERC721(config.tokenAddress).balanceOf(account);
        } else if (config.tokenType == VotingTokenType.REPUTATION) {
            return RepModule(config.tokenAddress).getReputation(account, config.domain);
        }

        return 0;
    }

    /**
     * @notice Gets the voting delay
     * @return The voting delay in blocks
     */
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /**
     * @notice Gets the voting period
     * @return The voting period in blocks
     */
    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /**
     * @notice Gets the quorum numerator
     * @return The quorum numerator
     */
    function quorumNumerator()
        public
        view
        override(GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorumNumerator();
    }

    /**
     * @notice Gets the state of a proposal
     * @param proposalId The proposal ID
     * @return The proposal state
     */
    function state(
        uint256 proposalId
    )
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @notice Proposes a proposal
     * @param targets The target addresses
     * @param values The ETH values
     * @param calldatas The calldata arrays
     * @param descriptionHash The description hash
     * @return The proposal ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        revert("use propose with voting config");
    }

    /**
     * @notice Executes a proposal
     * @param targets The target addresses
     * @param values The ETH values
     * @param calldatas The calldata arrays
     * @param descriptionHash The description hash
     */
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        if (isEmergencyProposal[proposalId]) {
            require(!vetoedProposals[proposalId], "proposal vetoed");
            require(
                block.number - emergencyProposalTimestamps[proposalId] <= emergencyConfig.timeLimit,
                "emergency proposal expired"
            );
            require(
                emergencyVotes[proposalId] >= (getVotingPower(address(this)) * emergencyConfig.threshold) / 100,
                "insufficient emergency votes"
            );
            require(
                emergencyCommittees[proposalId].approvals >= emergencyConfig.committeeThreshold,
                "insufficient committee approvals"
            );
        }
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Cancels a proposal
     * @param targets The target addresses
     * @param values The ETH values
     * @param calldatas The calldata arrays
     * @param descriptionHash The description hash
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Gets the executor
     * @return The executor address
     */
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    /**
     * @notice Supports interface
     * @param interfaceId The interface ID
     * @return True if the interface is supported
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(Governor, GovernorTimelockControl, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Treasury Management
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(tokenConfigs[token].isWhitelisted, "token not whitelisted");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "transfer failed");
        tokenBalances[token] += amount;
        emit TokenDeposited(token, msg.sender, amount);
    }

    function withdrawToken(
        address token,
        uint256 amount,
        bytes32 categoryId,
        bytes[] memory signatures
    ) external nonReentrant {
        require(tokenBalances[token] >= amount, "insufficient balance");
        
        TokenConfig storage config = tokenConfigs[token];
        if (block.timestamp - config.lastSpendTimestamp >= SECONDS_PER_DAY) {
            config.spentToday = 0;
            config.lastSpendTimestamp = block.timestamp;
        }
        
        require(config.spentToday + amount <= config.dailySpendLimit, "daily limit exceeded");
        config.spentToday += amount;

        // Verify signatures
        bytes32 messageHash = keccak256(abi.encodePacked(token, amount, categoryId));
        uint256 validSignatures = 0;
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = messageHash.recover(signatures[i]);
            if (config.signers[signer] && !pendingSignatures[categoryId][signer]) {
                validSignatures++;
                pendingSignatures[categoryId][signer] = true;
                emit SignatureAdded(categoryId, signer);
            }
        }
        
        require(validSignatures >= config.requiredSignatures, "insufficient signatures");
        
        tokenBalances[token] -= amount;
        require(IERC20(token).transfer(msg.sender, amount), "transfer failed");
        emit TokenWithdrawn(token, msg.sender, amount);
    }

    function whitelistToken(address token, uint256 dailyLimit) external onlyRole(PROPOSER_ROLE) {
        require(token != address(0), "invalid token");
        require(!tokenConfigs[token].isWhitelisted, "token already whitelisted");
        
        tokenConfigs[token] = TokenConfig({
            isWhitelisted: true,
            dailySpendLimit: dailyLimit,
            lastSpendTimestamp: block.timestamp,
            spentToday: 0,
            requiredSignatures: 0
        });
        
        whitelistedTokens.add(token);
        emit TokenWhitelisted(token, dailyLimit);
    }

    function removeToken(address token) external onlyRole(PROPOSER_ROLE) {
        require(tokenConfigs[token].isWhitelisted, "token not whitelisted");
        require(tokenBalances[token] == 0, "token has balance");
        
        delete tokenConfigs[token];
        whitelistedTokens.remove(token);
        emit TokenRemoved(token);
    }

    function updateDailySpendLimit(address token, uint256 newLimit) external onlyRole(PROPOSER_ROLE) {
        require(tokenConfigs[token].isWhitelisted, "token not whitelisted");
        tokenConfigs[token].dailySpendLimit = newLimit;
        emit DailySpendLimitUpdated(token, newLimit);
    }

    // Reputation Management
    function setReputationModule(address _repModule) external onlyRole(PROPOSER_ROLE) {
        repModule = _repModule;
        emit ReputationModuleSet(_repModule);
    }

    function enableReputationVoting(bool enabled) external onlyRole(PROPOSER_ROLE) {
        useReputationVoting = enabled;
        emit ReputationVotingEnabled(enabled);
    }

    function addReputationDomain(string memory domain, uint256 decayRate) external onlyRole(PROPOSER_ROLE) {
        require(!activeDomains[domain], "domain already active");
        activeDomains[domain] = true;
        emit ReputationDomainAdded(domain, decayRate);
    }

    function removeReputationDomain(string memory domain) external onlyRole(PROPOSER_ROLE) {
        require(activeDomains[domain], "domain not active");
        activeDomains[domain] = false;
        emit ReputationDomainRemoved(domain);
    }

    function updateReputationScore(address account, string memory domain, uint256 score) external {
        require(msg.sender == repModule, "only rep module");
        require(activeDomains[domain], "domain not active");
        
        ReputationConfig storage config = reputationConfigs[account][domain];
        if (config.lastUpdate > 0) {
            uint256 daysPassed = (block.timestamp - config.lastUpdate) / SECONDS_PER_DAY;
            uint256 decay = (config.baseScore * config.decayRate * daysPassed) / 10000;
            score = score > decay ? score - decay : 0;
        }
        
        reputationScores[account][domain] = score;
        config.lastUpdate = block.timestamp;
        config.baseScore = score;
        
        emit ReputationScoreUpdated(account, domain, score);
    }

    function delegateReputation(
        address to,
        string memory domain,
        uint256 amount,
        uint256 duration
    ) external {
        require(activeDomains[domain], "domain not active");
        require(reputationConfigs[msg.sender][domain].allowDelegation, "delegation not allowed");
        require(reputationScores[msg.sender][domain] >= amount, "insufficient reputation");
        
        reputationScores[msg.sender][domain] -= amount;
        reputationDelegations[msg.sender][domain] = Delegation({
            delegate: to,
            amount: amount,
            until: block.timestamp + duration
        });
        
        emit ReputationDelegated(msg.sender, to, domain, amount, block.timestamp + duration);
    }

    function undelegateReputation(string memory domain) external {
        require(activeDomains[domain], "domain not active");
        Delegation storage delegation = reputationDelegations[msg.sender][domain];
        require(delegation.amount > 0, "no delegation");
        
        reputationScores[msg.sender][domain] += delegation.amount;
        delete reputationDelegations[msg.sender][domain];
        
        emit ReputationUndelegated(msg.sender, delegation.delegate, domain);
    }

    function stakeReputation(
        string memory domain,
        uint256 amount,
        uint256 lockPeriod
    ) external {
        require(activeDomains[domain], "domain not active");
        ReputationConfig storage config = reputationConfigs[msg.sender][domain];
        require(config.allowStaking, "staking not allowed");
        require(amount >= config.minStakeAmount, "amount too low");
        require(amount <= config.maxStakeAmount, "amount too high");
        require(reputationScores[msg.sender][domain] >= amount, "insufficient reputation");
        
        reputationScores[msg.sender][domain] -= amount;
        reputationStakes[msg.sender][domain] = Stake({
            amount: amount,
            startTime: block.timestamp,
            lockUntil: block.timestamp + lockPeriod,
            multiplier: 15000 // 150% multiplier
        });
        
        emit ReputationStaked(msg.sender, domain, amount, 15000);
    }

    function unstakeReputation(string memory domain) external {
        require(activeDomains[domain], "domain not active");
        Stake storage stake = reputationStakes[msg.sender][domain];
        require(stake.amount > 0, "no stake");
        require(block.timestamp >= stake.lockUntil, "still locked");
        
        uint256 amount = stake.amount;
        delete reputationStakes[msg.sender][domain];
        reputationScores[msg.sender][domain] += amount;
        
        emit ReputationUnstaked(msg.sender, domain, amount);
    }

    function getVotingPower(address account) public view returns (uint256) {
        if (useReputationVoting && repModule != address(0)) {
            uint256 totalRep = 0;
            for (uint256 i = 0; i < whitelistedTokens.length(); i++) {
                string memory domain = string(abi.encodePacked("voting_", whitelistedTokens.at(i)));
                if (activeDomains[domain]) {
                    // Add direct reputation
                    totalRep += reputationScores[account][domain];
                    
                    // Add delegated reputation
                    Delegation storage delegation = reputationDelegations[account][domain];
                    if (delegation.amount > 0 && block.timestamp <= delegation.until) {
                        totalRep += delegation.amount;
                    }
                    
                    // Add staked reputation with multiplier
                    Stake storage stake = reputationStakes[account][domain];
                    if (stake.amount > 0 && block.timestamp < stake.lockUntil) {
                        totalRep += (stake.amount * stake.multiplier) / 10000;
                    }
                }
            }
            return totalRep;
        }
        return token.getPastVotes(account, block.number - 1);
    }

    // Emergency Proposals
    function addCommitteeMember(address member, string memory role) external onlyRole(PROPOSER_ROLE) {
        require(!emergencyConfig.committeeMembers[member], "already member");
        emergencyConfig.committeeMembers[member] = true;
        
        EmergencyCommittee storage committee = emergencyCommittees[0];
        committee.roles[role].members[member] = true;
        
        emit CommitteeMemberAdded(member, role);
    }

    function removeCommitteeMember(address member, string memory role) external onlyRole(PROPOSER_ROLE) {
        require(emergencyConfig.committeeMembers[member], "not member");
        emergencyConfig.committeeMembers[member] = false;
        
        EmergencyCommittee storage committee = emergencyCommittees[0];
        committee.roles[role].members[member] = false;
        
        emit CommitteeMemberRemoved(member, role);
    }

    function approveEmergencyProposal(uint256 proposalId) external {
        require(isEmergencyProposal[proposalId], "not emergency proposal");
        require(emergencyConfig.committeeMembers[msg.sender], "not committee member");
        require(!emergencyCommittees[proposalId].hasApproved[msg.sender], "already approved");
        
        EmergencyCommittee storage committee = emergencyCommittees[proposalId];
        committee.hasApproved[msg.sender] = true;
        committee.approvals++;
        
        emit CommitteeApprovalAdded(proposalId, msg.sender);
    }

    function createEmergencyProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        isEmergencyProposal[proposalId] = true;
        emergencyProposalTimestamps[proposalId] = block.number;
        emit EmergencyProposalCreated(proposalId, msg.sender);
        return proposalId;
    }

    function vetoEmergencyProposal(uint256 proposalId) external {
        require(isEmergencyProposal[proposalId], "not emergency proposal");
        require(emergencyConfig.hasVeto, "veto not enabled");
        require(msg.sender == emergencyConfig.vetoAddress, "not veto address");
        require(!vetoedProposals[proposalId], "already vetoed");
        
        vetoedProposals[proposalId] = true;
        emit EmergencyProposalVetoed(proposalId, msg.sender);
    }

    // Enhanced Treasury Management
    function createBudgetTransfer(
        bytes32 fromCategory,
        bytes32 toCategory,
        uint256 amount,
        uint256 deadline
    ) external returns (uint256) {
        require(spendingCategories[fromCategory].budget >= amount, "insufficient budget");
        require(deadline > block.timestamp, "invalid deadline");
        
        uint256 transferId = budgetTransferCount++;
        BudgetTransfer storage transfer = budgetTransfers[transferId];
        
        transfer.fromCategory = fromCategory;
        transfer.toCategory = toCategory;
        transfer.amount = amount;
        transfer.deadline = deadline;
        
        emit BudgetTransferCreated(transferId, fromCategory, toCategory, amount);
        return transferId;
    }

    function approveBudgetTransfer(uint256 transferId) external {
        BudgetTransfer storage transfer = budgetTransfers[transferId];
        require(transfer.fromCategory != bytes32(0), "transfer not found");
        require(!transfer.executed, "transfer executed");
        require(block.timestamp <= transfer.deadline, "transfer expired");
        require(!transfer.approvals[msg.sender], "already approved");
        
        SpendingCategory storage fromCategory = spendingCategories[transfer.fromCategory];
        require(fromCategory.authorizedSigners[msg.sender], "not authorized");
        
        transfer.approvals[msg.sender] = true;
        transfer.approvalCount++;
        
        emit BudgetTransferApproved(transferId, msg.sender);
    }

    function executeBudgetTransfer(uint256 transferId) external nonReentrant {
        BudgetTransfer storage transfer = budgetTransfers[transferId];
        require(transfer.fromCategory != bytes32(0), "transfer not found");
        require(!transfer.executed, "transfer executed");
        require(block.timestamp <= transfer.deadline, "transfer expired");
        
        SpendingCategory storage fromCategory = spendingCategories[transfer.fromCategory];
        require(transfer.approvalCount >= fromCategory.requiredSignatures, "insufficient approvals");
        
        transfer.executed = true;
        spendingCategories[transfer.fromCategory].budget -= transfer.amount;
        spendingCategories[transfer.toCategory].budget += transfer.amount;
        
        emit BudgetTransferExecuted(transferId);
    }

    // Enhanced Reputation Management
    function joinReputationPool(string memory domain, uint256 amount) external {
        require(activeDomains[domain], "domain not active");
        ReputationConfig storage config = reputationConfigs[msg.sender][domain];
        require(config.allowPooling, "pooling not allowed");
        require(reputationScores[msg.sender][domain] >= amount, "insufficient reputation");
        
        reputationScores[msg.sender][domain] -= amount;
        ReputationPool storage pool = reputationPools[domain];
        pool.totalStaked += amount;
        pool.userStakes[msg.sender] += amount;
        
        emit ReputationPooled(msg.sender, domain, amount);
    }

    function leaveReputationPool(string memory domain, uint256 amount) external {
        require(activeDomains[domain], "domain not active");
        ReputationPool storage pool = reputationPools[domain];
        require(pool.userStakes[msg.sender] >= amount, "insufficient stake");
        
        pool.totalStaked -= amount;
        pool.userStakes[msg.sender] -= amount;
        reputationScores[msg.sender][domain] += amount;
        
        emit ReputationUnpooled(msg.sender, domain, amount);
    }

    function slashReputation(
        address account,
        string memory domain,
        uint256 amount
    ) external {
        require(activeDomains[domain], "domain not active");
        SlashingCondition storage condition = slashingConditions[domain];
        require(condition.isActive, "slashing not active");
        require(block.timestamp - condition.lastViolation[account] >= condition.gracePeriod, "in grace period");
        
        uint256 slashAmount = (amount * condition.slashingRate) / 10000;
        reputationScores[account][domain] = reputationScores[account][domain] > slashAmount 
            ? reputationScores[account][domain] - slashAmount 
            : 0;
        
        condition.lastViolation[account] = block.timestamp;
        emit ReputationSlashed(account, domain, slashAmount);
    }

    // Enhanced Committee Roles
    function addCommitteeRole(
        string memory role,
        uint256 weight,
        bool canVeto,
        bool canPropose,
        string[] memory parentRoles,
        string[] memory childRoles
    ) external onlyRole(PROPOSER_ROLE) {
        EmergencyCommittee storage committee = emergencyCommittees[0];
        CommitteeRole storage newRole = committee.roles[role];
        
        newRole.name = role;
        newRole.weight = weight;
        newRole.canVeto = canVeto;
        newRole.canPropose = canPropose;
        newRole.parentRoles = parentRoles;
        newRole.childRoles = childRoles;
    }

    function getRoleHierarchy(string memory role) external view returns (string[] memory parents, string[] memory children) {
        EmergencyCommittee storage committee = emergencyCommittees[0];
        CommitteeRole storage roleConfig = committee.roles[role];
        return (roleConfig.parentRoles, roleConfig.childRoles);
    }

    function hasRolePermission(address account, string memory role, string memory permission) external view returns (bool) {
        EmergencyCommittee storage committee = emergencyCommittees[0];
        CommitteeRole storage roleConfig = committee.roles[role];
        
        if (!roleConfig.members[account]) return false;
        
        if (keccak256(bytes(permission)) == keccak256(bytes("veto"))) {
            return roleConfig.canVeto;
        } else if (keccak256(bytes(permission)) == keccak256(bytes("propose"))) {
            return roleConfig.canPropose;
        }
        
        return false;
    }
}

interface IRepModule {
    function getReputation(address account, string calldata domain) external view returns (uint256);
} 