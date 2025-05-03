import { polygonZkEvm } from "viem/chains";

export const repModule = {
  address: "0x0000000000000000000000000000000000000000", // Replace with deployed address
  abi: [
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "domain",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "intervalBlocks",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "decayBpPerInterval",
          type: "uint256",
        },
      ],
      name: "configureDomain",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          internalType: "bytes32",
          name: "domain",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "grant",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          internalType: "bytes32",
          name: "domain",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "revoke",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          internalType: "bytes32",
          name: "domain",
          type: "bytes32",
        },
      ],
      name: "getReputation",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      name: "decayRateBp",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      name: "decayInterval",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
  chainId: polygonZkEvm.id,
} as const; 