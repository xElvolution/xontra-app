export interface ChainConfig {
  id: number
  name: string
  shortName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  color: string
  isTestnet: boolean
  imageUrl: string
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 5031,
    name: "Somnia Mainnet",
    shortName: "MAINNET",
    nativeCurrency: {
      name: "SOMI",
      symbol: "SOMI",
      decimals: 18
    },
    rpcUrls: [
      process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://api.infra.mainnet.somnia.network/",
      "https://api.infra.mainnet.somnia.network/"
    ],
    blockExplorerUrls: ["https://explorer.somnia.network"],
    color: "#8B5CF6",
    isTestnet: false,
    imageUrl: "/images/chains/5031.png"
  },
  {
    id: 50312,
    name: "Somnia Testnet",
    shortName: "TESTNET",
    nativeCurrency: {
      name: "STT",
      symbol: "STT",
      decimals: 18
    },
    rpcUrls: [
      process.env.NEXT_PUBLIC_SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network/",
      "https://dream-rpc.somnia.network/"
    ],
    blockExplorerUrls: ["https://shannon-explorer.somnia.network/"],
    color: "#A855F7",
    isTestnet: true,
    imageUrl: "/images/chains/50312.png"
  }
]

export function getChainById(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId)
}

export function getChainByShortName(shortName: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.shortName.toLowerCase() === shortName.toLowerCase())
}

export function getDefaultChain(): ChainConfig {
  return SUPPORTED_CHAINS[0] // Somnia Mainnet
}

