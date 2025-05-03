import { createConfig, http } from "wagmi"
import { polygonZkEvmTestnet } from "wagmi/chains"
import { injected } from "wagmi/connectors"

export const config = createConfig({
  chains: [polygonZkEvmTestnet],
  connectors: [injected()],
  transports: {
    [polygonZkEvmTestnet.id]: http(),
  },
}) 