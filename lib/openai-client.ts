// Client-side functions that call our secure API routes
// This replaces the direct OpenAI calls in the original openai.ts

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

// Parse natural language command using our secure API route
export async function parseCommand(command: string): Promise<AIResponse> {
  try {
    const response = await fetch('/api/openai/parse-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    return data

  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse command. Please try rephrasing.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Generate AI response for user queries using our secure API route
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
    const response = await fetch('/api/openai/generate-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        command,
        context 
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    return data.response

  } catch (error) {
    return 'I\'m having trouble connecting right now. Please try again.'
  }
}

// Quick command suggestions (unchanged)
export const QUICK_COMMANDS = [
  "Swap 1 SOMI for STT",
  "Get quote for 500 STT to SOMI", 
  "Check my SOMI balance",
  "What's the best time to swap?",
  "Explain MEV protection",
  "Show me gas prices"
]

