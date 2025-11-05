# Xontra DEX Contracts

This directory contains the smart contracts for the Xontra DEX.

## Contracts

- **XontraFactory.sol**: Factory contract for creating token pairs
- **XontraRouter.sol**: Router contract for token swaps and liquidity management
- **WSTT.sol**: Wrapped native token (Somnia Testnet)
- **USDT.sol**: Tether USD stablecoin
- **XON.sol**: Base ERC20 token contract

## Deployment

### Environment Variables

Create a `.env` file in the contracts directory:

```env
PRIVATE_KEY=your_private_key_here
SOMNIA_RPC_URL=https://api.infra.mainnet.somnia.network/
SOMNIA_TESTNET_RPC_URL=https://dream-rpc.somnia.network/
SOMNIA_API_KEY=your_api_key
SOMNIA_TESTNET_API_KEY=your_testnet_api_key
```

### Compile Contracts

```bash
npm run compile
```

### Deploy Contracts

#### Testnet Deployment

```bash
npm run deploy:testnet
```

#### Mainnet Deployment

```bash
npm run deploy:mainnet
```

### Verify Contracts

```bash
npx hardhat verify --network <network> <contract_address> <constructor_args>
```

## Deployment Script

Create `scripts/deploy.js` with the following structure:

```javascript
async function main() {
  // Deploy contracts
  // Update deployed-tokens.json
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Token List

Deployed addresses are stored in `deployments/deployed-tokens.json`.

## License

MIT

