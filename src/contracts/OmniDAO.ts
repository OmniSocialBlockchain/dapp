import { polygonZkEvm } from "viem/chains";

export const omniDAO = {
  address: "0x0000000000000000000000000000000000000000" as const,
  abi: [
    {
      inputs: [],
      name: "init",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "daoName", type: "string" },
        { name: "token", type: "address" },
        { name: "quorumPercent", type: "uint256" },
        { name: "daoCreator", type: "address" },
        { name: "_repModule", type: "address" },
      ],
      name: "init",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    // Treasury Management
    {
      inputs: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "depositToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "withdrawToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "token", type: "address" }],
      name: "addSupportedToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "", type: "address" }],
      name: "tokenBalances",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "", type: "uint256" }],
      name: "supportedTokens",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    // Reputation Management
    {
      inputs: [{ name: "_repModule", type: "address" }],
      name: "setReputationModule",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "enabled", type: "bool" }],
      name: "enableReputationVoting",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "account", type: "address" }],
      name: "getVotingPower",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "repModule",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "useReputationVoting",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    // Emergency Proposals
    {
      inputs: [{ name: "threshold", type: "uint256" }],
      name: "setEmergencyThreshold",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "targets", type: "address[]" },
        { name: "values", type: "uint256[]" },
        { name: "calldatas", type: "bytes[]" },
        { name: "description", type: "string" },
      ],
      name: "createEmergencyProposal",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "", type: "uint256" }],
      name: "isEmergencyProposal",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "", type: "uint256" }],
      name: "emergencyVotes",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "emergencyThreshold",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    // Existing Governor functions
    {
      inputs: [],
      name: "votingDelay",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "votingPeriod",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "blockNumber", type: "uint256" }],
      name: "quorum",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "proposalId", type: "uint256" }],
      name: "state",
      outputs: [{ name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "targets", type: "address[]" },
        { name: "values", type: "uint256[]" },
        { name: "calldatas", type: "bytes[]" },
        { name: "description", type: "string" },
      ],
      name: "propose",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "proposalId", type: "uint256" },
        { name: "targets", type: "address[]" },
        { name: "values", type: "uint256[]" },
        { name: "calldatas", type: "bytes[]" },
        { name: "descriptionHash", type: "bytes32" },
      ],
      name: "execute",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "targets", type: "address[]" },
        { name: "values", type: "uint256[]" },
        { name: "calldatas", type: "bytes[]" },
        { name: "descriptionHash", type: "bytes32" },
      ],
      name: "cancel",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ name: "interfaceId", type: "bytes4" }],
      name: "supportsInterface",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    // Events
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "token", type: "address" },
        { indexed: true, name: "from", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
      ],
      name: "TokenDeposited",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "token", type: "address" },
        { indexed: true, name: "to", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
      ],
      name: "TokenWithdrawn",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "proposalId", type: "uint256" },
        { indexed: true, name: "proposer", type: "address" },
      ],
      name: "EmergencyProposalCreated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "proposalId", type: "uint256" },
      ],
      name: "EmergencyProposalExecuted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, name: "enabled", type: "bool" },
      ],
      name: "ReputationVotingEnabled",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "module", type: "address" },
      ],
      name: "ReputationModuleSet",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, name: "threshold", type: "uint256" },
      ],
      name: "EmergencyThresholdSet",
      type: "event",
    },
  ] as const,
  chainId: polygonZkEvm.id,
} as const; 