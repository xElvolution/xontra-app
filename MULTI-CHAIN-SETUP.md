# Multi-Chain Setup Guide

## 🔑 Required API Keys

To enable token balances and recent transactions for all chains, you need API keys from their respective block explorers:

### 1. Ethereum (Chain ID: 1)
- **Service**: Etherscan
- **URL**: https://etherscan.io/apis
- **Environment Variable**: `NEXT_PUBLIC_ETHERSCAN_API_KEY`

### 2. Polygon (Chain ID: 137)
- **Service**: Polygonscan
- **URL**: https://polygonscan.com/apis
- **Environment Variable**: `NEXT_PUBLIC_POLYGONSCAN_API_KEY`

### 3. BNB Smart Chain (Chain ID: 56)
- **Service**: BSCScan
- **URL**: https://bscscan.com/apis
- **Environment Variable**: `NEXT_PUBLIC_BSCSCAN_API_KEY`

### 4. Base (Chain ID: 8453)
- **Service**: BaseScan
- **URL**: https://basescan.org/apis
- **Environment Variable**: `NEXT_PUBLIC_BASESCAN_API_KEY`

### 5. Arbitrum (Chain ID: 42161)
- **Service**: Arbiscan
- **URL**: https://arbiscan.io/apis
- **Environment Variable**: `NEXT_PUBLIC_ARBISCAN_API_KEY`

## 📝 Setup Steps

1. **Get API Keys**: Visit each block explorer and sign up for free API access
2. **Add to .env.local**: Create a `.env.local` file in your project root
3. **Restart Dev Server**: Restart your development server after adding the keys

## 💡 Example .env.local

```bash
# Multi-Chain API Keys
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_key_here
NEXT_PUBLIC_POLYGONSCAN_API_KEY=your_polygonscan_key_here
NEXT_PUBLIC_BSCSCAN_API_KEY=your_bscscan_key_here
NEXT_PUBLIC_BASESCAN_API_KEY=your_basescan_key_here
NEXT_PUBLIC_ARBISCAN_API_KEY=your_arbiscan_key_here

# OpenAI API Key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
```

## ✅ What This Enables

- **Real Token Balances**: Shows actual ERC-20 token balances for each chain
- **Recent Transactions**: Displays real transaction history for each chain
- **Chain-Specific Data**: Automatically fetches data from the correct block explorer
- **No More Mock Data**: All data comes from real blockchain APIs

## 🚨 Important Notes

- **Free Tier Limits**: Most block explorers offer free API access with rate limits
- **API Key Security**: These keys are public (NEXT_PUBLIC_) but have rate limits
- **Fallback Behavior**: If an API key is missing, that chain will show empty data
- **Rate Limiting**: Respect API rate limits to avoid temporary blocks

