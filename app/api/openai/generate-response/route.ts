import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SERPAPI_KEY = process.env.SERPAPI_KEY

if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables.')
}

// Web search function
async function searchWeb(query: string): Promise<string> {
  if (!SERPAPI_KEY) {
    return "Web search not available - API key not configured"
  }

  try {
    const response = await fetch(`https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`)
    const data = await response.json()
    
    if (data.organic_results && data.organic_results.length > 0) {
      const firstResult = data.organic_results[0]
      return `Search result: ${firstResult.title} - ${firstResult.snippet}`
    }
    
    return "No search results found"
  } catch (error) {
    console.error('Web search error:', error)
    return "Web search failed"
  }
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

    // Check if user is asking for real-time data (prices, market info, etc.)
    const needsRealTimeData = /price|cost|value|trading|market|bitcoin|btc|ethereum|eth|crypto|defi|tvl|volume/i.test(command)
    
    let webSearchResult = ""
    if (needsRealTimeData) {
      webSearchResult = await searchWeb(command)
    }

    // Build conversation messages with history
    const messages = [
      {
        role: 'system',
        content: `You are XONTRA, an AI assistant for a decentralized exchange. You help users with trading, DeFi, and cryptocurrency questions. Be helpful and informative. 

IMPORTANT: 
- You have access to real-time web search data. Use it to provide current prices and market information.
- For concepts like MEV, DeFi, Uniswap, etc., provide comprehensive explanations based on your knowledge.
- When you have web search results, use them to give accurate, up-to-date information.
- Maintain conversation context. If a user says "yes" or "more info" after you provide data, continue discussing that specific topic.
- Remember what you were just talking about and continue the conversation naturally.`
      }
    ]

    // Add conversation history if available
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory.slice(-6)) // Keep last 6 messages for context
    }

    // Add current user message with web search data if available
    let userMessage = command
    if (webSearchResult) {
      userMessage = `${command}\n\n[REAL-TIME DATA]: ${webSearchResult}`
    }
    
    messages.push({
      role: 'user',
      content: userMessage
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