# 🧠 Xontra AI — Intelligent DeFi Layer

**Xontra AI** is an intelligent layer that sits on top of decentralized applications, especially DeFi platforms like DEXs, and turns complex blockchain interactions into simple natural-language prompts. It acts as a **personal AI agent for on-chain finance**.

## 🚀 Overview

Xontra AI revolutionizes decentralized finance by making complex blockchain interactions as simple as having a conversation. Instead of navigating through multiple interfaces, users can simply type what they want to do, and Xontra AI handles the rest.

### ⚙️ How It Works

#### **Prompt-Based Interaction**
Users simply type what they want (e.g. "Swap 1 SOMI to USDC with the lowest fees"), and Xontra AI translates that into the correct blockchain transactions.

#### **Wallet-Connected Execution**
After the user connects their crypto wallet, Xontra AI handles the full process: planning the best route, estimating slippage and gas, and building optimized transactions.

#### **AI-Powered Optimization**
It compares real-time liquidity pools, network conditions, and pricing data to choose the most efficient way to execute a transaction.

#### **Smart Contract Automation**
Once optimized, Xontra AI sends the transaction to the underlying smart contracts on the blockchain to execute.

#### **Post-Transaction Insights**
After confirmation, Xontra AI explains the result in simple terms and suggests next best actions (e.g. staking, reinvesting, or withdrawing).

## 💡 Core Value Proposition

- **One-click DeFi** — simplifies complex DeFi actions into one prompt
- **Lower costs & higher efficiency** — optimizes for best routes, lowest fees
- **Accessible to all users** — no technical knowledge required
- **Scalable** — can be integrated into any DEX, wallet, or Web3 platform

## 🌟 Key Features

### 🤖 AI-Powered Trading
- Natural language processing for complex DeFi operations
- Intelligent route optimization across multiple DEXs
- Real-time market analysis and price prediction
- Automated slippage and gas fee optimization

### 🔗 Multi-Chain Support
- **Somnia Chain** - Primary network for low-cost transactions
- Cross-chain bridge integration
- Multi-wallet support (MetaMask, Coinbase Wallet, etc.)
- Seamless asset transfers between chains

### 🛡️ Security & Privacy
- Zero-knowledge privacy protocols
- Non-custodial wallet integration
- Smart contract security audits
- Transparent transaction execution

### 📊 Advanced Analytics
- Real-time market data and insights
- Predictive market analysis
- Portfolio tracking and optimization
- Performance analytics and reporting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- SOMI tokens for gas fees on Somnia Chain

### Installation

```bash
# Clone the repository
git clone https://github.com/xElvolution/xontra-ai.git

# Navigate to the project directory
cd xontra-ai

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# OpenAI API Key for AI-powered trading
OPENAI_API_KEY==your_openai_key_here


# Somnia Exchange addresses (Somnia Mainnet)
NEXT_PUBLIC_SOMNIA_ROUTER=0xCdE9aFDca1AdAb5b5C6E4F9e16c9802C88Dc7e1A
NEXT_PUBLIC_SOMNIA_FACTORY=0x6C4853C97b981Aa848C2b56F160a73a46b5DCCD4

# Somnia Token addresses (Somnia Mainnet)
NEXT_PUBLIC_USDC_ADDRESS=0x28bec7e30e6faee657a03e19bf1128aad7632a00
NEXT_PUBLIC_SOMNIAEXCHANGE_ADDRESS=0xf2f773753cebefaf9b68b841d80c083b18c69311
NEXT_PUBLIC_PING_ADDRESS=0x33e7fab0a8a5da1a923180989bd617c9c2d1c493
NEXT_PUBLIC_PONG_ADDRESS=0x9beaa0016c22b646ac311ab171270b0ecf23098f

# Somnia Testnet addresses
NEXT_PUBLIC_SOMNIA_TESTNET_ROUTER=0xb98c15a0dC1e271132e341250703c7e94c059e8D
NEXT_PUBLIC_SOMNIA_TESTNET_FACTORY=0x31015A978c5815EdE29D0F969a17e116BC1866B1
NEXT_PUBLIC_WSTT_ADDRESS=0xF22eF0085f6511f70b01a68F360dCc56261F768a
NEXT_PUBLIC_USDT_TESTNET_ADDRESS=0xda4fde38be7a2b959bf46e032ecfa21e64019b76

# RPC URLs for Somnia chains
NEXT_PUBLIC_SOMNIA_RPC_URL=https://api.infra.mainnet.somnia.network/
NEXT_PUBLIC_SOMNIA_TESTNET_RPC_URL=https://dream-rpc.somnia.network/
```

## 🏗️ Architecture

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations and transitions

### Backend
- **OpenAI API** - AI-powered command processing
- **Block Explorer APIs** - Real-time blockchain data
- **Vercel** - Deployment and hosting

### Blockchain Integration
- **Somnia Chain** - Primary blockchain network (Mainnet & Testnet)
- **Ethereum** - Secondary network support
- **Multi-Chain Support** - Polygon, BSC, Base, Arbitrum
- **Wagmi & Viem** - Modern Web3 interaction
- **RainbowKit** - Multi-wallet support
- **Uniswap V3** - DEX integration
- **LiFi** - Cross-chain bridging

## 📱 Usage Examples

### Basic Trading
```
"Swap 100 USDC for SOMI"
"Buy $50 worth of BTC"
"Convert all my USDT to SOMI when price hits $2500"
```

### Advanced Operations
```
"Show me the best yield farming opportunities"
"Stake my SOMI tokens for maximum returns"
"Set up a DCA strategy for BTC"
```

### Portfolio Management
```
"Show my current portfolio balance"
"Analyze my trading performance"
"Suggest optimal rebalancing"
```

## 🔧 Development

### Project Structure

```
xontra-dex/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── swap/              # Swap page
│   │   └── page.tsx
│   └── nfts/              # NFT pages
│       ├── page.tsx       # Main NFT page
│       ├── agents/        # Agent NFTs
│       │   └── page.tsx
│       └── founders/      # Founder NFTs
│           └── page.tsx
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── navigation.tsx     # Main navigation
│   ├── wallet-drawer.tsx  # Wallet interface
│   ├── xontra-prompt-engine.tsx  # AI prompt engine
│   ├── network-matrix.tsx # Network status
│   ├── portfolio-matrix.tsx # Portfolio display
│   └── ...               # Other components
├── lib/                  # Utility functions
│   ├── chains.ts         # Chain configurations
│   ├── somniaswap.ts     # DEX logic
│   ├── somniascan.ts     # Blockchain data
│   ├── openai.ts         # AI integration
│   ├── providers.tsx     # Web3 providers
│   └── ...               # Other utilities
├── public/               # Static assets
│   └── images/           # Images and icons
├── styles/               # Additional styles
└── ...                   # Config files
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://xontra.xyz](https://xontra.xyz)
- **Documentation**: [https://docs.xontra.xyz](https://docs.xontra.xyz)
- **Community**: [https://community.xontra.xyz](https://community.xontra.xyz)
- **Twitter**: [@Xontra](https://twitter.com/xontra)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Components from [shadcn/ui](https://ui.shadcn.com/)
- Web3 integration with [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/)
- Wallet support via [RainbowKit](https://www.rainbowkit.com/)
- AI powered by [OpenAI](https://openai.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Built with ❤️ by the Xontra AI Team**

*Making DeFi accessible to everyone, one prompt at a time.*