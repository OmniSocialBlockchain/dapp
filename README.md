# OmniSocial Blockchain

A decentralized social platform built on blockchain technology with DAO governance.

## Features

- 🏦 **DAO Governance**: Community-driven decision making
- 👤 **Persona NFTs**: Unique digital identities
- 💬 **Social Posts**: Decentralized content sharing
- 💰 **Treasury Management**: Community fund management
- 🗳️ **Proposal System**: Transparent voting mechanism
- 🔐 **Wallet Integration**: Secure crypto wallet support
- 🌓 **Dark/Light Mode**: User-friendly interface

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Smart Contracts**: Solidity, Hardhat
- **Blockchain**: Ethereum
- **UI**: Tailwind CSS, shadcn/ui
- **Wallet**: wagmi v2
- **Storage**: IPFS
- **Testing**: Hardhat tests

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Hardhat
- MetaMask or other Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/OmniSocialBlockchain/dapp.git
cd dapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## Smart Contracts

The project includes several smart contracts:

- `OmniDAO.sol`: DAO governance contract
- `PersonaNFT.sol`: NFT-based identity system
- `OmniToken.sol`: Utility token
- `SocialPost.sol`: Content management
- `Treasury.sol`: Fund management

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security concerns, please email security@omnisocial.dev

## Support

- Documentation: [docs.omnisocial.dev](https://docs.omnisocial.dev)
- Discord: [Join our community](https://discord.gg/omnisocial)
- Twitter: [@OmniSocial](https://twitter.com/OmniSocial) 