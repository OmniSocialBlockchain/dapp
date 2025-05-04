import { createConfig, http } from "wagmi"
import { polygonZkEvm, polygonZkEvmTestnet } from "wagmi/chains"
import { injected, metaMask, walletConnect } from "wagmi/connectors"

const chains = [polygonZkEvm, polygonZkEvmTestnet]

export const config = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
  ],
  transports: {
    [polygonZkEvm.id]: http(),
    [polygonZkEvmTestnet.id]: http(),
  },
}) 