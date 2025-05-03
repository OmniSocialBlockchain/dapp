import { polygonZkEvmTestnet } from "wagmi/chains"

export const personaContract = {
  address: "0x1234567890123456789012345678901234567890", // Replace with actual contract address
  abi: [
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "balanceOf",
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
  chainId: polygonZkEvmTestnet.id,
} 