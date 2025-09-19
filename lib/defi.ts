// Real-time DeFi data fetching service
const DEFI_PULSE_API = 'https://api.llama.fi'
const COINGECKO_DEFI_API = 'https://api.coingecko.com/api/v3'

export interface DeFiProtocol {
  name: string
  symbol: string
  tvl: number
  tvl_change_24h: number
  tvl_change_percentage_24h: number
  chains: string[]
  category: string
  url: string
}

export interface DeFiChain {
  name: string
  tvl: number
  tvl_change_24h: number
  tvl_change_percentage_24h: number
  protocols: number
}

export interface DeFiYield {
  protocol: string
  token: string
  apy: number
  tvl: number
  risk: 'low' | 'medium' | 'high'
  chain: string
}

export interface DeFiResponse {
  success: boolean
  data?: any
  error?: string
}

// Get top DeFi protocols by TVL
export async function getTopDeFiProtocols(limit: number = 10): Promise<DeFiResponse> {
  try {
    const response = await fetch(`${DEFI_PULSE_API}/protocols`)
    
    if (!response.ok) {
      throw new Error(`DeFi Pulse API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Sort by TVL and take top N
    const sortedProtocols = data
      .sort((a: any, b: any) => b.tvl - a.tvl)
      .slice(0, limit)
      .map((protocol: any) => ({
        name: protocol.name,
        symbol: protocol.symbol || protocol.name,
        tvl: protocol.tvl,
        tvl_change_24h: protocol.tvlChange24h || 0,
        tvl_change_percentage_24h: protocol.tvlChange24hPercentage || 0,
        chains: protocol.chains || [],
        category: protocol.category || 'DeFi',
        url: protocol.url || ''
      }))
    
    return {
      success: true,
      data: sortedProtocols
    }
  } catch (error) {
    console.error('Error fetching DeFi protocols:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DeFi protocols'
    }
  }
}

// Get DeFi TVL by chain
export async function getDeFiTVLByChain(): Promise<DeFiResponse> {
  try {
    const response = await fetch(`${DEFI_PULSE_API}/chains`)
    
    if (!response.ok) {
      throw new Error(`DeFi Pulse API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    const chainData = data.map((chain: any) => ({
      name: chain.name,
      tvl: chain.tvl,
      tvl_change_24h: chain.tvlChange24h || 0,
      tvl_change_percentage_24h: chain.tvlChange24hPercentage || 0,
      protocols: chain.protocols || 0
    }))
    
    return {
      success: true,
      data: chainData
    }
  } catch (error) {
    console.error('Error fetching DeFi TVL by chain:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DeFi TVL data'
    }
  }
}

// Get DeFi yield farming opportunities
export async function getDeFiYields(): Promise<DeFiResponse> {
  try {
    const response = await fetch(`${DEFI_PULSE_API}/yields`)
    
    if (!response.ok) {
      throw new Error(`DeFi Pulse API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filter and format yield data
    const yieldData = data
      .filter((yieldItem: any) => yieldItem.apy > 0 && yieldItem.tvl > 1000000) // Only yields with >1M TVL
      .sort((a: any, b: any) => b.apy - a.apy)
      .slice(0, 20)
      .map((yieldItem: any) => ({
        protocol: yieldItem.protocol,
        token: yieldItem.symbol,
        apy: yieldItem.apy,
        tvl: yieldItem.tvl,
        risk: yieldItem.risk || 'medium',
        chain: yieldItem.chain || 'Unknown'
      }))
    
    return {
      success: true,
      data: yieldData
    }
  } catch (error) {
    console.error('Error fetching DeFi yields:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DeFi yield data'
    }
  }
}

// Get total DeFi TVL
export async function getTotalDeFiTVL(): Promise<DeFiResponse> {
  try {
    const response = await fetch(`${DEFI_PULSE_API}/tvl`)
    
    if (!response.ok) {
      throw new Error(`DeFi Pulse API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      data: {
        total_tvl: data,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching total DeFi TVL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch total DeFi TVL'
    }
  }
}

// Get DeFi token prices from CoinGecko
export async function getDeFiTokenPrices(): Promise<DeFiResponse> {
  try {
    const response = await fetch(
      `${COINGECKO_DEFI_API}/coins/markets?vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=20&page=1&sparkline=false&locale=en`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    const tokenData = data.map((token: any) => ({
      name: token.name,
      symbol: token.symbol.toUpperCase(),
      price: token.current_price,
      price_change_24h: token.price_change_percentage_24h,
      market_cap: token.market_cap,
      market_cap_rank: token.market_cap_rank
    }))
    
    return {
      success: true,
      data: tokenData
    }
  } catch (error) {
    console.error('Error fetching DeFi token prices:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DeFi token prices'
    }
  }
}
