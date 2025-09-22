import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables.')
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

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

    const parsedCommand = JSON.parse(jsonMatch[0])
    
    // Validate parsed command
    if (!parsedCommand.action || !parsedCommand.inputToken) {
      throw new Error('Invalid command structure')
    }

    return NextResponse.json({
      success: true,
      parsedCommand,
      message: parsedCommand.message || 'Command parsed successfully'
    })

  } catch (error) {
    console.error('Error parsing command:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to parse command. Please try rephrasing.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

