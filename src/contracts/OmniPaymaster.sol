// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title OmniPaymaster
 * @notice Gas sponsorship system for account abstraction
 * @dev Implements BasePaymaster with whitelisted selectors and daily quotas
 */
contract OmniPaymaster is BasePaymaster, AccessControl, ReentrancyGuard, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using ECDSA for bytes32;
    using Math for uint256;
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SECURITY_ROLE = keccak256("SECURITY_ROLE");
    bytes32 public constant ANALYTICS_ROLE = keccak256("ANALYTICS_ROLE");
    bytes32 public constant RULE_MANAGER_ROLE = keccak256("RULE_MANAGER_ROLE");
    bytes32 public constant OPTIMIZER_ROLE = keccak256("OPTIMIZER_ROLE");
    bytes32 public constant DELEGATOR_ROLE = keccak256("DELEGATOR_ROLE");
    bytes32 public constant PREDICTOR_ROLE = keccak256("PREDICTOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct UserQuota {
        uint256 dailyLimit;
        uint256 spentToday;
        uint256 lastSpendTimestamp;
        uint256 lastOperationTimestamp;
        uint256 operationsInWindow;
        uint256 suspiciousOperations;
        uint256 lastSuspiciousTimestamp;
        uint256 reputationScore;
        uint256 reputationMultiplier;
        uint256 reputationDecayRate;
        uint256 lastReputationUpdate;
        uint256 successfulOperations;
        uint256 failedOperations;
        uint256 averageGasPerOp;
        uint256 totalGasSponsored;
        uint256 delegatedReputation;
        uint256 receivedDelegations;
        uint256 delegationScore;
        uint256 lastDelegationUpdate;
        uint256 delegationMultiplier;
        uint256 predictionScore;
        uint256 lastPredictionUpdate;
        uint256 usedToday;
        uint256 lastReset;
        bool isWhitelisted;
    }

    struct Delegation {
        address delegator;
        address delegatee;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 claimedAmount;
        bool active;
        uint256 successRate;
        uint256 gasEfficiency;
        uint256 operationCount;
        uint256 lastUpdate;
    }

    struct Prediction {
        bytes4 selector;
        uint256 predictedGas;
        uint256 predictedOperations;
        uint256 confidence;
        uint256 timestamp;
        uint256 actualGas;
        uint256 actualOperations;
        bool validated;
        uint256 accuracy;
        uint256 predictionCount;
        uint256 successCount;
    }

    struct GasAnalytics {
        uint256 totalGasSponsored;
        uint256 totalOperations;
        uint256 averageGasPerOp;
        mapping(address => uint256) userGasSponsored;
        mapping(address => uint256) userOperations;
        mapping(address => uint256) suspiciousOperations;
        mapping(bytes4 => uint256) selectorGasUsage;
        mapping(bytes4 => uint256) selectorOperationCount;
        mapping(uint256 => uint256) hourlyGasUsage;
        mapping(uint256 => uint256) hourlyOperationCount;
        mapping(uint256 => uint256) dailyGasUsage;
        mapping(uint256 => uint256) dailyOperationCount;
        mapping(uint256 => uint256) weeklyGasUsage;
        mapping(uint256 => uint256) weeklyOperationCount;
        mapping(uint256 => uint256) monthlyGasUsage;
        mapping(uint256 => uint256) monthlyOperationCount;
        uint256 peakHourlyGas;
        uint256 peakDailyGas;
        uint256 peakWeeklyGas;
        uint256 peakMonthlyGas;
        uint256 peakHourlyOps;
        uint256 peakDailyOps;
        uint256 peakWeeklyOps;
        uint256 peakMonthlyOps;
        mapping(bytes4 => Prediction[]) selectorPredictions;
        mapping(address => Delegation[]) userDelegations;
    }

    struct SecurityConfig {
        uint256 rateLimitWindow;
        uint256 maxOperationsPerWindow;
        uint256 minTimeBetweenOps;
        bool emergencyStopEnabled;
        uint256 emergencyStopTimestamp;
        uint256 emergencyStopDuration;
        uint256 suspiciousThreshold;
        uint256 suspiciousWindow;
        uint256 autoBlockThreshold;
        uint256 autoBlockDuration;
        uint256 ruleUpdateInterval;
        uint256 lastRuleUpdate;
        uint256 optimizationInterval;
        uint256 lastOptimization;
        uint256 minReputationScore;
        uint256 maxReputationScore;
        uint256 reputationDecayInterval;
        uint256 reputationUpdateInterval;
    }

    struct EmergencyStop {
        bool active;
        uint256 timestamp;
        uint256 duration;
        uint256 requiredSignatures;
        mapping(address => bool) signatures;
        uint256 signatureCount;
    }

    struct SecurityRule {
        bytes4 selector;
        uint256 maxGas;
        uint256 maxOperations;
        uint256 timeWindow;
        bool autoBlock;
        bool enabled;
        uint256 lastUpdate;
        address lastUpdater;
        uint256 updateCount;
        uint256 gasUsage;
        uint256 operationCount;
        uint256 successRate;
        uint256 averageGasPerOp;
        uint256 optimizationScore;
        uint256 lastOptimization;
        uint256 optimizationCount;
    }

    struct RuleUpdate {
        bytes4 selector;
        uint256 newMaxGas;
        uint256 newMaxOperations;
        uint256 newTimeWindow;
        bool newAutoBlock;
        uint256 timestamp;
        address proposedBy;
        uint256 approvalCount;
        mapping(address => bool) approvals;
        uint256 optimizationScore;
        string optimizationReason;
    }

    struct ReputationConfig {
        uint256 baseScore;
        uint256 maxScore;
        uint256 minScore;
        uint256 decayRate;
        uint256 updateInterval;
        uint256 successMultiplier;
        uint256 failurePenalty;
        uint256 suspiciousPenalty;
        uint256 gasEfficiencyBonus;
        uint256 operationConsistencyBonus;
    }

    // Selector management
    mapping(bytes4 => bool) public allowedSelectors;
    mapping(bytes4 => uint256) public selectorGasLimits;
    mapping(bytes4 => uint256) public selectorRateLimits;
    
    // User management
    mapping(address => UserQuota) public userQuotas;
    EnumerableSet.AddressSet private whitelistedUsers;
    EnumerableSet.AddressSet private blacklistedUsers;
    EnumerableSet.AddressSet private emergencySigners;
    
    // Analytics
    GasAnalytics public analytics;
    SecurityConfig public securityConfig;
    EmergencyStop public emergencyStop;
    SecurityRule[] public securityRules;
    RuleUpdate[] public pendingRuleUpdates;
    ReputationConfig public reputationConfig;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant SECONDS_PER_HOUR = 3600;
    uint256 public constant SECONDS_PER_WEEK = 604800;
    uint256 public constant SECONDS_PER_MONTH = 2592000;
    
    // New mappings for delegation and prediction
    mapping(address => Delegation[]) public delegations;
    mapping(bytes4 => Prediction[]) public predictions;
    mapping(address => uint256) public delegationScores;
    mapping(bytes4 => uint256) public predictionAccuracies;
    
    // Operation tracking
    struct Operation {
        bytes4 selector;
        uint256 gasUsed;
        bool success;
        uint256 timestamp;
    }

    mapping(address => Operation[]) public userOperations;
    
    // Events
    event SelectorAllowed(bytes4 indexed selector, bool allowed, uint256 gasLimit, uint256 rateLimit);
    event UserWhitelisted(address indexed user, uint256 dailyLimit);
    event UserRemoved(address indexed user);
    event UserBlacklisted(address indexed user, string reason);
    event UserUnblacklisted(address indexed user);
    event QuotaChanged(address indexed user, uint256 newQuota);
    event GasSponsored(address indexed user, uint256 amount);
    event DailyQuotaReset(address indexed user);
    event EmergencyStopActivated(uint256 duration, uint256 requiredSignatures);
    event EmergencyStopDeactivated();
    event EmergencySignatureAdded(address indexed signer);
    event SecurityConfigUpdated(
        uint256 rateLimitWindow,
        uint256 maxOperationsPerWindow,
        uint256 minTimeBetweenOps,
        uint256 suspiciousThreshold,
        uint256 suspiciousWindow,
        uint256 autoBlockThreshold,
        uint256 autoBlockDuration,
        uint256 ruleUpdateInterval,
        uint256 optimizationInterval,
        uint256 minReputationScore,
        uint256 maxReputationScore,
        uint256 reputationDecayInterval,
        uint256 reputationUpdateInterval
    );
    event SecurityRuleAdded(
        bytes4 indexed selector,
        uint256 maxGas,
        uint256 maxOperations,
        uint256 timeWindow,
        bool autoBlock
    );
    event SecurityRuleRemoved(bytes4 indexed selector);
    event SecurityRuleUpdated(
        bytes4 indexed selector,
        uint256 newMaxGas,
        uint256 newMaxOperations,
        uint256 newTimeWindow,
        bool newAutoBlock
    );
    event RuleUpdateProposed(
        uint256 indexed updateId,
        bytes4 indexed selector,
        uint256 newMaxGas,
        uint256 newMaxOperations,
        uint256 newTimeWindow,
        bool newAutoBlock,
        uint256 optimizationScore,
        string optimizationReason
    );
    event RuleUpdateApproved(uint256 indexed updateId, address indexed approver);
    event RuleUpdateExecuted(uint256 indexed updateId);
    event SuspiciousActivityDetected(address indexed user, string reason);
    event AutoBlocked(address indexed user, uint256 duration);
    event ReputationUpdated(address indexed user, uint256 newScore, uint256 newMultiplier);
    event AnalyticsUpdated(
        uint256 totalGasSponsored,
        uint256 totalOperations,
        uint256 averageGasPerOp,
        uint256 peakHourlyGas,
        uint256 peakDailyGas,
        uint256 peakWeeklyGas,
        uint256 peakMonthlyGas
    );
    event RuleOptimized(
        bytes4 indexed selector,
        uint256 oldMaxGas,
        uint256 newMaxGas,
        uint256 oldMaxOperations,
        uint256 newMaxOperations,
        uint256 optimizationScore
    );
    event DelegationCreated(
        address indexed delegator,
        address indexed delegatee,
        uint256 amount,
        uint256 startTime,
        uint256 endTime
    );
    event DelegationUpdated(
        address indexed delegator,
        address indexed delegatee,
        uint256 newAmount,
        uint256 successRate,
        uint256 gasEfficiency
    );
    event DelegationEnded(
        address indexed delegator,
        address indexed delegatee,
        uint256 claimedAmount,
        uint256 finalScore
    );
    event PredictionCreated(
        bytes4 indexed selector,
        uint256 predictedGas,
        uint256 predictedOperations,
        uint256 confidence
    );
    event PredictionValidated(
        bytes4 indexed selector,
        uint256 actualGas,
        uint256 actualOperations,
        uint256 accuracy
    );
    event PredictionAccuracyUpdated(
        bytes4 indexed selector,
        uint256 newAccuracy,
        uint256 predictionCount
    );
    event DailyLimitUpdated(address indexed user, uint256 newLimit);
    event SelectorWhitelisted(bytes4 indexed selector);
    event SelectorRemoved(bytes4 indexed selector);
    event GasPriceUpdated(uint256 minPrice, uint256 maxPrice);
    event GasLimitUpdated(uint256 newLimit);
    event OperationSponsored(
        address indexed user,
        bytes4 indexed selector,
        uint256 gasUsed,
        bool success
    );

    constructor(IEntryPoint ep) {
        entryPoint = ep;
        
        // Setup roles
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(SECURITY_ROLE, msg.sender);
        _setupRole(ANALYTICS_ROLE, msg.sender);
        _setupRole(RULE_MANAGER_ROLE, msg.sender);
        _setupRole(OPTIMIZER_ROLE, msg.sender);
        _setupRole(DELEGATOR_ROLE, msg.sender);
        _setupRole(PREDICTOR_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        _setRoleAdmin(OPERATOR_ROLE, ADMIN_ROLE);
        
        securityConfig = SecurityConfig({
            rateLimitWindow: 3600,
            maxOperationsPerWindow: 100,
            minTimeBetweenOps: 60,
            emergencyStopEnabled: false,
            emergencyStopTimestamp: 0,
            emergencyStopDuration: 0,
            suspiciousThreshold: 5,
            suspiciousWindow: 3600,
            autoBlockThreshold: 10,
            autoBlockDuration: 86400,
            ruleUpdateInterval: 86400,
            lastRuleUpdate: block.timestamp,
            optimizationInterval: 86400,
            lastOptimization: block.timestamp,
            minReputationScore: 0,
            maxReputationScore: 1000,
            reputationDecayInterval: 86400,
            reputationUpdateInterval: 3600
        });

        reputationConfig = ReputationConfig({
            baseScore: 500,
            maxScore: 1000,
            minScore: 0,
            decayRate: 1,
            updateInterval: 3600,
            successMultiplier: 2,
            failurePenalty: 5,
            suspiciousPenalty: 10,
            gasEfficiencyBonus: 3,
            operationConsistencyBonus: 2
        });
    }

    function _setupRole(bytes32 role, address account) internal {
        _grantRole(role, account);
        _setRoleAdmin(role, ADMIN_ROLE);
    }

    function grantRole(bytes32 role, address account) public override onlyRole(ADMIN_ROLE) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(ADMIN_ROLE) {
        _revokeRole(role, account);
    }

    function optimizeRules() external onlyRole(OPTIMIZER_ROLE) {
        require(
            block.timestamp >= securityConfig.lastOptimization + securityConfig.optimizationInterval,
            "optimization too soon"
        );

        for (uint256 i = 0; i < securityRules.length; i++) {
            SecurityRule storage rule = securityRules[i];
            if (!rule.enabled) continue;

            uint256 currentScore = _calculateRuleOptimizationScore(rule);
            if (currentScore > rule.optimizationScore) {
                _proposeRuleOptimization(rule, currentScore);
            }
        }

        securityConfig.lastOptimization = block.timestamp;
    }

    function _calculateRuleOptimizationScore(SecurityRule storage rule) internal view returns (uint256) {
        if (rule.operationCount == 0) return 0;

        uint256 gasEfficiency = (rule.gasUsage * 100) / rule.operationCount;
        uint256 successRate = (rule.successRate * 100) / rule.operationCount;
        uint256 utilization = (rule.operationCount * 100) / rule.maxOperations;

        return (gasEfficiency * 40 + successRate * 30 + utilization * 30) / 100;
    }

    function _proposeRuleOptimization(SecurityRule storage rule, uint256 score) internal {
        uint256 newMaxGas = rule.maxGas;
        uint256 newMaxOperations = rule.maxOperations;
        string memory reason;

        if (rule.gasUsage / rule.operationCount < rule.maxGas * 80 / 100) {
            newMaxGas = (rule.maxGas * 90) / 100;
            reason = "gas efficiency improvement";
        }

        if (rule.operationCount > rule.maxOperations * 80 / 100) {
            newMaxOperations = (rule.maxOperations * 110) / 100;
            reason = "operation volume increase";
        }

        if (newMaxGas != rule.maxGas || newMaxOperations != rule.maxOperations) {
            proposeRuleUpdate(
                rule.selector,
                newMaxGas,
                newMaxOperations,
                rule.timeWindow,
                rule.autoBlock
            );

            emit RuleOptimized(
                rule.selector,
                rule.maxGas,
                newMaxGas,
                rule.maxOperations,
                newMaxOperations,
                score
            );
        }
    }

    function updateUserReputation(address user) external onlyRole(ANALYTICS_ROLE) {
        require(whitelistedUsers.contains(user), "user not whitelisted");
        UserQuota storage quota = userQuotas[user];

        uint256 decayPeriods = (block.timestamp - quota.lastReputationUpdate) / reputationConfig.updateInterval;
        if (decayPeriods > 0) {
            quota.reputationScore = Math.max(
                reputationConfig.minScore,
                quota.reputationScore - (decayPeriods * reputationConfig.decayRate)
            );
        }

        uint256 successRate = quota.successfulOperations > 0
            ? (quota.successfulOperations * 100) / (quota.successfulOperations + quota.failedOperations)
            : 0;

        uint256 gasEfficiency = quota.totalGasSponsored > 0
            ? (quota.averageGasPerOp * 100) / quota.totalGasSponsored
            : 0;

        uint256 newScore = quota.reputationScore;
        
        if (successRate > 90) {
            newScore += reputationConfig.successMultiplier;
        }
        if (gasEfficiency > 80) {
            newScore += reputationConfig.gasEfficiencyBonus;
        }
        if (quota.suspiciousOperations > 0) {
            newScore -= reputationConfig.suspiciousPenalty * quota.suspiciousOperations;
        }

        quota.reputationScore = Math.min(reputationConfig.maxScore, Math.max(reputationConfig.minScore, newScore));
        quota.reputationMultiplier = 100 + (quota.reputationScore / 10);
        quota.lastReputationUpdate = block.timestamp;

        emit ReputationUpdated(user, quota.reputationScore, quota.reputationMultiplier);
    }

    function updateAnalytics() external onlyRole(ANALYTICS_ROLE) {
        uint256 currentHour = block.timestamp / SECONDS_PER_HOUR;
        uint256 currentDay = block.timestamp / SECONDS_PER_DAY;
        uint256 currentWeek = block.timestamp / SECONDS_PER_WEEK;
        uint256 currentMonth = block.timestamp / SECONDS_PER_MONTH;

        analytics.hourlyGasUsage[currentHour] = analytics.totalGasSponsored;
        analytics.hourlyOperationCount[currentHour] = analytics.totalOperations;
        analytics.dailyGasUsage[currentDay] = analytics.totalGasSponsored;
        analytics.dailyOperationCount[currentDay] = analytics.totalOperations;
        analytics.weeklyGasUsage[currentWeek] = analytics.totalGasSponsored;
        analytics.weeklyOperationCount[currentWeek] = analytics.totalOperations;
        analytics.monthlyGasUsage[currentMonth] = analytics.totalGasSponsored;
        analytics.monthlyOperationCount[currentMonth] = analytics.totalOperations;

        if (analytics.hourlyGasUsage[currentHour] > analytics.peakHourlyGas) {
            analytics.peakHourlyGas = analytics.hourlyGasUsage[currentHour];
        }
        if (analytics.dailyGasUsage[currentDay] > analytics.peakDailyGas) {
            analytics.peakDailyGas = analytics.dailyGasUsage[currentDay];
        }
        if (analytics.weeklyGasUsage[currentWeek] > analytics.peakWeeklyGas) {
            analytics.peakWeeklyGas = analytics.weeklyGasUsage[currentWeek];
        }
        if (analytics.monthlyGasUsage[currentMonth] > analytics.peakMonthlyGas) {
            analytics.peakMonthlyGas = analytics.monthlyGasUsage[currentMonth];
        }

        if (analytics.hourlyOperationCount[currentHour] > analytics.peakHourlyOps) {
            analytics.peakHourlyOps = analytics.hourlyOperationCount[currentHour];
        }
        if (analytics.dailyOperationCount[currentDay] > analytics.peakDailyOps) {
            analytics.peakDailyOps = analytics.dailyOperationCount[currentDay];
        }
        if (analytics.weeklyOperationCount[currentWeek] > analytics.peakWeeklyOps) {
            analytics.peakWeeklyOps = analytics.weeklyOperationCount[currentWeek];
        }
        if (analytics.monthlyOperationCount[currentMonth] > analytics.peakMonthlyOps) {
            analytics.peakMonthlyOps = analytics.monthlyOperationCount[currentMonth];
        }

        emit AnalyticsUpdated(
            analytics.totalGasSponsored,
            analytics.totalOperations,
            analytics.averageGasPerOp,
            analytics.peakHourlyGas,
            analytics.peakDailyGas,
            analytics.peakWeeklyGas,
            analytics.peakMonthlyGas
        );
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32, /* userOpHash */
        uint256 maxCost
    ) internal view override returns (bytes memory context, uint256 validationData) {
        require(!paused(), "contract paused");
        require(!emergencyStop.active, "emergency stop active");
        
        bytes4 sel = bytes4(userOp.callData[0:4]);
        require(allowedSelectors[sel], "selector-blocked");
        
        require(userOp.callGasLimit <= selectorGasLimits[sel], "gas-limit-exceeded");
        
        address user = userOp.sender;
        require(whitelistedUsers.contains(user), "user-not-whitelisted");
        require(!blacklistedUsers.contains(user), "user-blacklisted");
        
        for (uint256 i = 0; i < securityRules.length; i++) {
            SecurityRule storage rule = securityRules[i];
            if (rule.enabled && rule.selector == sel) {
                require(userOp.callGasLimit <= rule.maxGas, "rule-gas-exceeded");
                UserQuota storage quota = userQuotas[user];
                if (block.timestamp - quota.lastOperationTimestamp < rule.timeWindow) {
                    require(quota.operationsInWindow < rule.maxOperations, "rule-ops-exceeded");
                }
            }
        }
        
        UserQuota storage quota = userQuotas[user];
        if (block.timestamp - quota.lastOperationTimestamp < securityConfig.minTimeBetweenOps) {
            revert("rate-limit-exceeded");
        }
        
        if (block.timestamp - quota.lastOperationTimestamp >= securityConfig.rateLimitWindow) {
            require(quota.operationsInWindow < securityConfig.maxOperationsPerWindow, "window-limit-exceeded");
        }
        
        if (quota.suspiciousOperations >= securityConfig.suspiciousThreshold) {
            if (block.timestamp - quota.lastSuspiciousTimestamp < securityConfig.suspiciousWindow) {
                revert("suspicious-activity");
            }
        }
        
        // Check predictions
        if (predictions[sel].length > 0) {
            Prediction storage latestPrediction = predictions[sel][predictions[sel].length - 1];
            if (latestPrediction.validated && latestPrediction.accuracy >= 80) {
                require(
                    userOp.callGasLimit <= latestPrediction.predictedGas * 110 / 100,
                    "gas-exceeds-prediction"
                );
            }
        }

        // Check delegation impact
        uint256 totalReputation = quota.reputationScore + quota.delegatedReputation;
        uint256 adjustedDailyLimit = (quota.dailyLimit * (100 + totalReputation / 10)) / 100;

        if (block.timestamp - quota.lastSpendTimestamp >= SECONDS_PER_DAY) {
            require(maxCost <= adjustedDailyLimit, "daily-quota-exceeded");
        } else {
            require(quota.spentToday + maxCost <= adjustedDailyLimit, "daily-quota-exceeded");
        }
        
        return (abi.encode(user, maxCost), 0);
    }

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 cost
    ) internal override nonReentrant {
        if (mode == PostOpMode.postOpReverted) {
            return;
        }

        (address user, uint256 maxCost) = abi.decode(context, (address, uint256));
        UserQuota storage quota = userQuotas[user];
        bytes4 sel = bytes4(context[0:4]);
        
        if (block.timestamp - quota.lastOperationTimestamp >= securityConfig.rateLimitWindow) {
            quota.operationsInWindow = 0;
        }
        quota.operationsInWindow++;
        quota.lastOperationTimestamp = block.timestamp;
        
        analytics.selectorGasUsage[sel] += cost;
        analytics.selectorOperationCount[sel]++;
        
        for (uint256 i = 0; i < securityRules.length; i++) {
            if (securityRules[i].selector == sel) {
                securityRules[i].gasUsage += cost;
                securityRules[i].operationCount++;
                securityRules[i].successRate++;
                securityRules[i].averageGasPerOp = securityRules[i].gasUsage / securityRules[i].operationCount;
            }
        }
        
        quota.successfulOperations++;
        quota.totalGasSponsored += cost;
        quota.averageGasPerOp = quota.totalGasSponsored / quota.successfulOperations;
        
        if (quota.operationsInWindow > securityConfig.suspiciousThreshold) {
            quota.suspiciousOperations++;
            quota.lastSuspiciousTimestamp = block.timestamp;
            emit SuspiciousActivityDetected(user, "high operation frequency");
            
            if (quota.suspiciousOperations >= securityConfig.autoBlockThreshold) {
                blacklistedUsers.add(user);
                emit AutoBlocked(user, securityConfig.autoBlockDuration);
            }
        }
        
        if (block.timestamp - quota.lastSpendTimestamp >= SECONDS_PER_DAY) {
            quota.spentToday = 0;
            quota.lastSpendTimestamp = block.timestamp;
            emit DailyQuotaReset(user);
        }
        
        quota.spentToday += cost;
        
        analytics.totalGasSponsored += cost;
        analytics.totalOperations += 1;
        analytics.averageGasPerOp = analytics.totalGasSponsored / analytics.totalOperations;
        analytics.userGasSponsored[user] += cost;
        analytics.userOperations[user] += 1;
        
        emit GasSponsored(user, cost);

        // Update delegation metrics
        for (uint256 i = 0; i < delegations[user].length; i++) {
            Delegation storage delegation = delegations[user][i];
            if (delegation.active) {
                delegation.operationCount++;
                if (mode == PostOpMode.postOpSucceeded) {
                    delegation.successRate = (delegation.successRate * (delegation.operationCount - 1) + 100) / 
                        delegation.operationCount;
                }
                delegation.gasEfficiency = (delegation.gasEfficiency * (delegation.operationCount - 1) + 
                    (cost * 100) / userOp.callGasLimit) / delegation.operationCount;
            }
        }

        // Update prediction metrics
        if (predictions[sel].length > 0) {
            Prediction storage latestPrediction = predictions[sel][predictions[sel].length - 1];
            if (!latestPrediction.validated) {
                latestPrediction.actualGas += cost;
                latestPrediction.actualOperations++;
            }
        }
    }

    // Delegation Management
    function createDelegation(
        address delegatee,
        uint256 amount,
        uint256 duration
    ) external onlyRole(DELEGATOR_ROLE) {
        require(whitelistedUsers.contains(msg.sender), "delegator not whitelisted");
        require(whitelistedUsers.contains(delegatee), "delegatee not whitelisted");
        require(amount > 0, "invalid amount");
        require(duration > 0, "invalid duration");

        UserQuota storage delegatorQuota = userQuotas[msg.sender];
        require(delegatorQuota.reputationScore >= amount, "insufficient reputation");

        delegations[msg.sender].push(Delegation({
            delegator: msg.sender,
            delegatee: delegatee,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            claimedAmount: 0,
            active: true,
            successRate: 0,
            gasEfficiency: 0,
            operationCount: 0,
            lastUpdate: block.timestamp
        }));

        delegatorQuota.delegatedReputation += amount;
        userQuotas[delegatee].receivedDelegations += amount;

        emit DelegationCreated(msg.sender, delegatee, amount, block.timestamp, block.timestamp + duration);
    }

    function updateDelegation(
        uint256 delegationId,
        uint256 successRate,
        uint256 gasEfficiency
    ) external onlyRole(DELEGATOR_ROLE) {
        require(delegationId < delegations[msg.sender].length, "invalid delegation");
        Delegation storage delegation = delegations[msg.sender][delegationId];
        require(delegation.active, "delegation inactive");

        delegation.successRate = successRate;
        delegation.gasEfficiency = gasEfficiency;
        delegation.lastUpdate = block.timestamp;

        emit DelegationUpdated(
            msg.sender,
            delegation.delegatee,
            delegation.amount,
            successRate,
            gasEfficiency
        );
    }

    function endDelegation(uint256 delegationId) external onlyRole(DELEGATOR_ROLE) {
        require(delegationId < delegations[msg.sender].length, "invalid delegation");
        Delegation storage delegation = delegations[msg.sender][delegationId];
        require(delegation.active, "delegation inactive");
        require(block.timestamp >= delegation.endTime, "delegation not expired");

        uint256 finalScore = _calculateDelegationScore(delegation);
        delegationScores[msg.sender] = finalScore;
        delegation.active = false;

        UserQuota storage delegatorQuota = userQuotas[msg.sender];
        delegatorQuota.delegatedReputation -= delegation.amount;
        userQuotas[delegation.delegatee].receivedDelegations -= delegation.amount;

        emit DelegationEnded(msg.sender, delegation.delegatee, delegation.claimedAmount, finalScore);
    }

    function _calculateDelegationScore(Delegation storage delegation) internal view returns (uint256) {
        if (delegation.operationCount == 0) return 0;

        uint256 successScore = (delegation.successRate * 40) / 100;
        uint256 efficiencyScore = (delegation.gasEfficiency * 30) / 100;
        uint256 operationScore = (delegation.operationCount * 30) / 100;

        return successScore + efficiencyScore + operationScore;
    }

    // Prediction Management
    function createPrediction(
        bytes4 selector,
        uint256 predictedGas,
        uint256 predictedOperations,
        uint256 confidence
    ) external onlyRole(PREDICTOR_ROLE) {
        require(allowedSelectors[selector], "selector not allowed");
        require(predictedGas > 0, "invalid gas prediction");
        require(predictedOperations > 0, "invalid operations prediction");
        require(confidence > 0 && confidence <= 100, "invalid confidence");

        predictions[selector].push(Prediction({
            selector: selector,
            predictedGas: predictedGas,
            predictedOperations: predictedOperations,
            confidence: confidence,
            timestamp: block.timestamp,
            actualGas: 0,
            actualOperations: 0,
            validated: false,
            accuracy: 0,
            predictionCount: 0,
            successCount: 0
        }));

        emit PredictionCreated(selector, predictedGas, predictedOperations, confidence);
    }

    function validatePrediction(
        bytes4 selector,
        uint256 predictionId,
        uint256 actualGas,
        uint256 actualOperations
    ) external onlyRole(PREDICTOR_ROLE) {
        require(predictionId < predictions[selector].length, "invalid prediction");
        Prediction storage prediction = predictions[selector][predictionId];
        require(!prediction.validated, "prediction already validated");

        prediction.actualGas = actualGas;
        prediction.actualOperations = actualOperations;
        prediction.validated = true;

        uint256 gasAccuracy = _calculateAccuracy(prediction.predictedGas, actualGas);
        uint256 opsAccuracy = _calculateAccuracy(prediction.predictedOperations, actualOperations);
        prediction.accuracy = (gasAccuracy + opsAccuracy) / 2;

        prediction.predictionCount++;
        if (prediction.accuracy >= 80) {
            prediction.successCount++;
        }

        predictionAccuracies[selector] = (predictionAccuracies[selector] * (prediction.predictionCount - 1) + 
            prediction.accuracy) / prediction.predictionCount;

        emit PredictionValidated(selector, actualGas, actualOperations, prediction.accuracy);
        emit PredictionAccuracyUpdated(selector, predictionAccuracies[selector], prediction.predictionCount);
    }

    function _calculateAccuracy(uint256 predicted, uint256 actual) internal pure returns (uint256) {
        if (actual == 0) return 0;
        uint256 difference = predicted > actual ? predicted - actual : actual - predicted;
        return 100 - ((difference * 100) / actual);
    }

    // Whitelist Management
    function whitelistUser(
        address user,
        uint256 dailyLimit
    ) external onlyRole(OPERATOR_ROLE) {
        require(user != address(0), "invalid user");
        require(!userQuotas[user].isWhitelisted, "already whitelisted");

        userQuotas[user] = UserQuota({
            dailyLimit: dailyLimit,
            spentToday: 0,
            lastSpendTimestamp: 0,
            lastOperationTimestamp: 0,
            operationsInWindow: 0,
            suspiciousOperations: 0,
            lastSuspiciousTimestamp: 0,
            reputationScore: 0,
            reputationMultiplier: 0,
            reputationDecayRate: 0,
            lastReputationUpdate: 0,
            successfulOperations: 0,
            failedOperations: 0,
            averageGasPerOp: 0,
            totalGasSponsored: 0,
            delegatedReputation: 0,
            receivedDelegations: 0,
            delegationScore: 0,
            lastDelegationUpdate: 0,
            predictionScore: 0,
            lastPredictionUpdate: 0,
            usedToday: 0,
            lastReset: block.timestamp,
            isWhitelisted: true
        });

        emit UserWhitelisted(user, dailyLimit);
    }

    function removeUser(address user) external onlyRole(OPERATOR_ROLE) {
        require(userQuotas[user].isWhitelisted, "not whitelisted");
        delete userQuotas[user];
        emit UserRemoved(user);
    }

    function updateDailyLimit(
        address user,
        uint256 newLimit
    ) external onlyRole(OPERATOR_ROLE) {
        require(userQuotas[user].isWhitelisted, "not whitelisted");
        userQuotas[user].dailyLimit = newLimit;
        emit DailyLimitUpdated(user, newLimit);
    }

    function whitelistSelector(bytes4 selector) external onlyRole(ADMIN_ROLE) {
        require(!allowedSelectors[selector], "already whitelisted");
        allowedSelectors[selector] = true;
        emit SelectorWhitelisted(selector);
    }

    function removeSelector(bytes4 selector) external onlyRole(ADMIN_ROLE) {
        require(allowedSelectors[selector], "not whitelisted");
        allowedSelectors[selector] = false;
        emit SelectorRemoved(selector);
    }

    function updateGasPrice(
        uint256 _minPrice,
        uint256 _maxPrice
    ) external onlyRole(ADMIN_ROLE) {
        require(_minPrice <= _maxPrice, "invalid range");
        selectorGasLimits[bytes4(0)] = _minPrice;
        selectorGasLimits[bytes4(1)] = _maxPrice;
        emit GasPriceUpdated(_minPrice, _maxPrice);
    }

    function updateGasLimit(uint256 newLimit) external onlyRole(ADMIN_ROLE) {
        require(newLimit > 0, "invalid limit");
        selectorGasLimits[bytes4(2)] = newLimit;
        emit GasLimitUpdated(newLimit);
    }

    function getAllowedSelectors() external view returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = bytes4(0);
        selectors[1] = bytes4(1);
        selectors[2] = bytes4(2);
        return selectors;
    }

    function getUserOperations(
        address user
    ) external view returns (Operation[] memory) {
        return userOperations[user];
    }

    function getUserQuota(
        address user
    ) external view returns (UserQuota memory) {
        return userQuotas[user];
    }

    function getAnalytics() external view returns (GasAnalytics memory) {
        return analytics;
    }

    receive() external payable {
        // Accept ETH deposits
    }

    function withdraw(
        address payable to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "invalid recipient");
        require(amount <= address(this).balance, "insufficient balance");
        to.transfer(amount);
    }
} 