import { createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { http } from 'viem';

const chains = [mainnet, sepolia];

export const config = createConfig({
  chains,
  connectors: [
    new MetaMaskConnector({
      chains,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
}); 