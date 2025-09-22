const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.')
}

// AI is now fully powered by OpenAI API and real-time price data

import { getTop10Cryptocurrencies, getETHPrice, getUSDTPrice } from './prices'
import { getTopDeFiProtocols, getDeFiTVLByChain, getDeFiYields, getTotalDeFiTVL, getDeFiTokenPrices } from './defi'

export interface ParsedCommand {
  action: 'SWAP_TOKEN' | 'GET_QUOTE' | 'CHECK_BALANCE' | 'GET_PRICE'
  inputToken: string
  outputToken: string
  amount: string
  slippageTolerance: number
  fee: number
  deadline: number
  message: string
}

export interface AIResponse {
  success: boolean
  parsedCommand?: ParsedCommand
  message: string
  error?: string
}


// Parse natural language command using OpenAI
export async function parseCommand(command: string): Promise<AIResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a decentralized exchange (DEX). Parse user commands into structured trading parameters.

Available tokens: SOMI, STT, WSOMI, WSTT, USDT, SOMNIAEXCHANGE, PING, PONG
Supported actions: SWAP_TOKEN, GET_QUOTE, CHECK_BALANCE, GET_PRICE, ADD_LIQUIDITY, REMOVE_LIQUIDITY, GET_LIQUIDITY_INFO

Parse the user's command and return a JSON object with these fields:
- action: The trading action
- inputToken: Input token symbol (for swaps) or first token (for liquidity)
- outputToken: Output token symbol (for swaps) or second token (for liquidity)
- amount: Amount to trade/add (as string)
- amountB: Second token amount for liquidity (as string, optional)
- slippageTolerance: Slippage tolerance (0.1 to 5.0)
- fee: Uniswap V3 fee tier (500, 3000, or 10000)
- deadline: Transaction deadline in seconds (300 = 5 minutes)
- message: Human-readable response

Example commands:
"Swap 1 SOMI for USDT" → SWAP_TOKEN with SOMI→USDT
"Get quote for 500 USDT to SOMI" → GET_QUOTE with USDT→SOMI
"Check my USDT balance" → CHECK_BALANCE for USDT
"What is USDT price" → GET_PRICE for USDT
"Add liquidity with 100 SOMI and 50 USDT" → ADD_LIQUIDITY with SOMI+USDT
"Add 100 SOMI to SOMI-USDT pool" → ADD_LIQUIDITY with SOMI+USDT
"Remove liquidity from SOMI-USDT pool" → REMOVE_LIQUIDITY with SOMI+USDT
"Show SOMI-USDT pool info" → GET_LIQUIDITY_INFO with SOMI+USDT
"Current SOMI price" → GET_PRICE for SOMI
"Swap 100 PING for PONG" → SWAP_TOKEN with PING→PONG
"Get quote for 50 SOMNIAEXCHANGE to USDT" → GET_QUOTE with SOMNIAEXCHANGE→USDT

Always return valid JSON.`
          },
          {
            role: 'user',
            content: command
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response')
    }

    const parsedCommand: ParsedCommand = JSON.parse(jsonMatch[0])
    
    // Validate parsed command
    if (!parsedCommand.action || !parsedCommand.inputToken) {
      throw new Error('Invalid command structure')
    }

    return {
      success: true,
      parsedCommand,
      message: parsedCommand.message || 'Command parsed successfully'
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse command. Please try rephrasing.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}


// Generate AI response for user queries with real-time data
export async function generateAIResponse(
  command: string,
  context?: {
    walletAddress?: string
    balances?: any[]
    recentTransactions?: any[]
    conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
  }
): Promise<string> {
  try {
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
    return data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'

  } catch (error) {
    return 'I\'m having trouble connecting right now. Please try again.'
  }
}



// Quick command suggestions
export const QUICK_COMMANDS = [
  "Swap 1 SOMI for STT",
  "Get quote for 500 STT to SOMI", 
  "Check my SOMI balance",
  "What's the best time to swap?",
  "Explain MEV protection",
  "Show me gas prices"
]
