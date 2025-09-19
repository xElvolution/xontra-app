// Real-time cryptocurrency price fetching service
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

export interface TokenPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap: number
  market_cap_rank: number
}

export interface TopTokensResponse {
  success: boolean
  data?: TokenPrice[]
  error?: string
}

// Get top 10 cryptocurrencies by market cap
export async function getTop10Cryptocurrencies(): Promise<TopTokensResponse> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&locale=en`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('Error fetching top cryptocurrencies:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch prices'
    }
  }
}

// Get specific token price
export async function getTokenPrice(tokenId: string): Promise<{ success: boolean; price?: number; error?: string }> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${tokenId}&vs_currencies=usd`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    const price = data[tokenId]?.usd
    
    if (!price) {
      throw new Error('Price not found')
    }
    
    return {
      success: true,
      price: price
    }
  } catch (error) {
    console.error(`Error fetching ${tokenId} price:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch price'
    }
  }
}

// Get ETH price specifically
export async function getETHPrice(): Promise<{ success: boolean; price?: number; error?: string }> {
  return getTokenPrice('ethereum')
}

// Get USDT price (should always be ~$1)
export async function getUSDTPrice(): Promise<{ success: boolean; price?: number; error?: string }> {
  return getTokenPrice('tether')
}
