import { NextRequest, NextResponse } from 'next/server'
import { getTop10Cryptocurrencies, getETHPrice, getUSDTPrice } from '@/lib/prices'
import { getTopDeFiProtocols, getDeFiTVLByChain, getDeFiYields, getTotalDeFiTVL, getDeFiTokenPrices } from '@/lib/defi'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables.')
}

export async function POST(request: NextRequest) {
  try {
    const { 
      command, 
      context 
    } = await request.json()

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Check if user is asking for price information
    const priceKeywords = ['price', 'somi', 'stt', 'wsomi', 'wstt', 'usdt', 'current', 'value', 'worth', 'top', 'trading', 'cryptocurrency', 'crypto', 'market', 'cap', 'list', 'coins', 'tokens']
    const isPriceQuery = priceKeywords.some(keyword => 
      command.toLowerCase().includes(keyword)
    )

    // Check if user is asking for DeFi information
    const defiKeywords = ['defi', 'decentralized finance', 'tvl', 'total value locked', 'yield', 'farming', 'liquidity', 'protocol', 'uniswap', 'aave', 'compound', 'maker', 'curve', 'sushi', 'pancakeswap', 'yield farming', 'staking', 'lending', 'borrowing']
    const isDeFiQuery = defiKeywords.some(keyword => 
      command.toLowerCase().includes(keyword)
    )

    let realTimeData = ''
    
    if (isDeFiQuery) {
      try {
        // Get real-time DeFi data
        const [defiProtocols, defiChains, defiYields, totalTVL, defiTokens] = await Promise.all([
          getTopDeFiProtocols(10),
          getDeFiTVLByChain(),
          getDeFiYields(),
          getTotalDeFiTVL(),
          getDeFiTokenPrices()
        ])

        if (defiProtocols.success && defiProtocols.data) {
          // Check what type of DeFi query
          const isTVLQuery = ['tvl', 'total value locked', 'protocol'].some(keyword => 
            command.toLowerCase().includes(keyword)
          )
          const isYieldQuery = ['yield', 'farming', 'apy', 'staking'].some(keyword => 
            command.toLowerCase().includes(keyword)
          )
          const isChainQuery = ['chain', 'somnia', 'mainnet', 'testnet'].some(keyword => 
            command.toLowerCase().includes(keyword)
          )

          if (isTVLQuery) {
            realTimeData = `\n\n**Real-Time DeFi Protocols (Top 10 by TVL):**\n`
            defiProtocols.data.forEach((protocol, index) => {
              const changeSymbol = protocol.tvl_change_percentage_24h > 0 ? '+' : ''
              realTimeData += `${index + 1}. ${protocol.name}: $${(protocol.tvl / 1e9).toFixed(2)}B TVL (${changeSymbol}${protocol.tvl_change_percentage_24h.toFixed(2)}%)\n`
            })
          } else if (isYieldQuery && defiYields.success && defiYields.data) {
            realTimeData = `\n\n**Real-Time DeFi Yield Opportunities:**\n`
            defiYields.data.slice(0, 10).forEach((yieldData, index) => {
              realTimeData += `${index + 1}. ${yieldData.protocol} - ${yieldData.token}: ${yieldData.apy.toFixed(2)}% APY ($${(yieldData.tvl / 1e6).toFixed(1)}M TVL)\n`
            })
          } else if (isChainQuery && defiChains.success && defiChains.data) {
            realTimeData = `\n\n**Real-Time DeFi TVL by Chain:**\n`
            defiChains.data.slice(0, 8).forEach((chain, index) => {
              const changeSymbol = chain.tvl_change_percentage_24h > 0 ? '+' : ''
              realTimeData += `${index + 1}. ${chain.name}: $${(chain.tvl / 1e9).toFixed(2)}B TVL (${changeSymbol}${chain.tvl_change_percentage_24h.toFixed(2)}%)\n`
            })
          } else {
            // General DeFi overview
            realTimeData = `\n\n**Real-Time DeFi Overview:**\n`
            if (totalTVL.success && totalTVL.data) {
              realTimeData += `• Total DeFi TVL: $${(totalTVL.data.total_tvl / 1e9).toFixed(2)}B\n`
            }
            realTimeData += `• Top Protocols:\n`
            defiProtocols.data.slice(0, 5).forEach((protocol, index) => {
              const changeSymbol = protocol.tvl_change_percentage_24h > 0 ? '+' : ''
              realTimeData += `  ${index + 1}. ${protocol.name}: $${(protocol.tvl / 1e9).toFixed(2)}B (${changeSymbol}${protocol.tvl_change_percentage_24h.toFixed(2)}%)\n`
            })
          }
          realTimeData += `\n*Live data provided by DeFiLlama API*`
        }
      } catch (defiError) {
        console.error('Error fetching DeFi data:', defiError)
        realTimeData = '\n\n*Real-time DeFi data temporarily unavailable*'
      }
    } else if (isPriceQuery) {
      try {
        // Get real-time price data
        const [topTokens, ethPrice, usdtPrice] = await Promise.all([
          getTop10Cryptocurrencies(),
          getETHPrice(),
          getUSDTPrice()
        ])

        if (topTokens.success && topTokens.data) {
          // Check if user is asking for top cryptocurrencies list
          const isTopListQuery = ['top', 'list', 'cryptocurrency', 'crypto', 'coins', 'tokens', 'market'].some(keyword => 
            command.toLowerCase().includes(keyword)
          )
          
          if (isTopListQuery) {
            // Show top 10 cryptocurrencies with real data
            realTimeData = `\n\n**Real-Time Top 10 Cryptocurrencies:**\n`
            topTokens.data.slice(0, 10).forEach((token, index) => {
              const changeSymbol = token.price_change_percentage_24h > 0 ? '+' : ''
              realTimeData += `${index + 1}. ${token.name} (${token.symbol.toUpperCase()}): $${token.current_price.toLocaleString()} (${changeSymbol}${token.price_change_percentage_24h.toFixed(2)}%)\n`
            })
            realTimeData += `\n*Live data provided by CoinGecko API*`
          } else {
            // Show individual token prices
            const somi = topTokens.data.find(token => token.symbol.toLowerCase() === 'somi')
            const stt = topTokens.data.find(token => token.symbol.toLowerCase() === 'stt')
            
            realTimeData = `\n\n**Real-Time Price Data:**\n`
            if (somi) {
              realTimeData += `• Somnia (SOMI): $${somi.current_price.toLocaleString()} (${somi.price_change_percentage_24h > 0 ? '+' : ''}${somi.price_change_percentage_24h.toFixed(2)}%)\n`
            }
            if (stt) {
              realTimeData += `• Somnia Test Token (STT): $${stt.current_price.toLocaleString()} (${stt.price_change_percentage_24h > 0 ? '+' : ''}${stt.price_change_percentage_24h.toFixed(2)}%)\n`
            }
            // Fallback prices for Somnia tokens
            if (!somi) {
              realTimeData += `• Somnia (SOMI): $0.01 (estimated)\n`
            }
            if (!stt) {
              realTimeData += `• Somnia Test Token (STT): $0.001 (estimated)\n`
            }
            realTimeData += `\n*Data provided by CoinGecko API*`
          }
        }
      } catch (priceError) {
        console.error('Error fetching price data:', priceError)
        realTimeData = '\n\n*Real-time price data temporarily unavailable*'
      }
    }

    // Build conversation messages with history
    const messages = [
      {
        role: 'system',
        content: `You are XONTRA, an AI assistant for a decentralized exchange. You help users with trading, DeFi, and cryptocurrency questions. Be helpful and informative. 

IMPORTANT: 
- If the user asks about cryptocurrency prices, you have access to real-time data. Always provide current prices when available.
- Maintain conversation context. If a user says "yes" or "more info" after you provide price data, continue discussing that specific cryptocurrency.
- Remember what you were just talking about and continue the conversation naturally.`
      }
    ]

    // Add conversation history if available
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory.slice(-6)) // Keep last 6 messages for context
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: command + realTimeData
    })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('Error generating AI response:', error)
    return NextResponse.json({ 
      response: 'I\'m having trouble connecting right now. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

