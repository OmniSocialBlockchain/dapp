# OmniSocial Smart Contracts

This directory contains the smart contracts for the OmniSocial platform.

## Contracts

### PersonaNFT.sol
- ERC721 token for user identities
- Allows users to create and manage multiple personas
- Each persona has a name, image, and description
- Users can activate/deactivate personas

### SocialPost.sol
- ERC721 token for social posts
- Posts are linked to personas
- Supports likes and comments
- Content and media are stored on IPFS

### OmniToken.sol
- ERC20 governance token
- Used for DAO voting and governance
- Initial supply: 1 billion tokens

### OmniDAO.sol
- DAO governance contract
- Uses token-weighted voting
- Supports proposals and voting
- Quorum: 4% of total supply

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with:
```
POLYGON_ZKEVM_TESTNET_RPC_URL=https://rpc.public.zkevm-test.net
POLYGON_ZKEVM_API_KEY=your_api_key_here
PRIVATE_KEY=your_private_key_here
```

3. Deploy contracts:
```bash
npx hardhat run scripts/deploy.ts --network polygonZkEvmTestnet
```

## Testing

Run tests:
```bash
npx hardhat test
```

## Security Considerations

- All contracts use OpenZeppelin's battle-tested implementations
- Access control is implemented using Ownable pattern
- Critical functions have proper access controls
- Contracts are upgradeable through proxy patterns

## License

MIT 