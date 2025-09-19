"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { parseCommand, generateAIResponse, type ParsedCommand } from '@/lib/openai'
import { getSwapQuote, executeSwap, type SwapQuote, type SwapTransaction } from '@/lib/somniaswap'
import { SUPPORTED_CHAINS, type ChainConfig } from '@/lib/chains'

export function XontraPromptEngine({ selectedChain, title }: { selectedChain: ChainConfig, title?: string }) {
  const [command, setCommand] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingSwap, setPendingSwap] = useState<ParsedCommand | null>(null)
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
    quote?: SwapQuote | null;
  }>>([
    {
      id: Date.now(),
      type: "ai",
      content: "Hi there! I'm XONTRA, your AI decentralized assistant. I can help you trade tokens, get quotes, and manage your DeFi activities. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null)
  const [isExecutingSwap, setIsExecutingSwap] = useState(false)
  
  // New state for copy and edit functionality
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  
  
  // State for input focus
  const [isInputFocused, setIsInputFocused] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (type: 'user' | 'ai', content: string, quote?: SwapQuote | null) => {
    const newMessage = {
      id: Date.now() + Math.random(), // Ensure unique ID
      type,
      content,
      timestamp: new Date(),
      quote, // Add quote data for interactive buttons
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Function to render markdown-like content as HTML
  const renderMessageContent = (content: string) => {
    // Convert **text** to <strong>text</strong>
    let html = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Convert [text](url) to <a> links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-500 hover:text-purple-400 underline">$1</a>')
    
    // Convert line breaks to <br>
    html = html.replace(/\n/g, '<br>')
    
    return { __html: html }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || isProcessing) return

    const userMessage = command.trim()
    addMessage('user', userMessage)
    setCommand("")
    setIsProcessing(true)

    try {
      // Check if user is responding "yes" to a pending swap
      if (pendingSwap && (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('execute') || userMessage.toLowerCase().includes('confirm'))) {
        await handleSwapToken(pendingSwap)
        setPendingSwap(null) // Clear pending swap after execution
        return
      }

      // Clear pending swap if user sends a new command
      if (pendingSwap) {
        setPendingSwap(null)
      }

      // Parse command using OpenAI
      const parseResult = await parseCommand(userMessage)
      
      if (parseResult.success && parseResult.parsedCommand) {
        const parsed = parseResult.parsedCommand
        
        // Handle different actions
        switch (parsed.action) {
          case 'GET_QUOTE':
            await handleGetQuote(parsed)
            break
          case 'SWAP_TOKEN':
            // Always show quote first for swap commands
            await handleGetQuote(parsed)
            break
          case 'CHECK_BALANCE':
            await handleCheckBalance(parsed)
            break
          case 'GET_PRICE':
            await handleGetPrice(parsed)
            break
          default:
            // Generate AI response for other queries
            const conversationHistory = messages
              .filter(msg => msg.type === 'user' || msg.type === 'ai')
              .slice(-6) // Keep last 6 messages
              .map(msg => ({
                role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
              }))
            
            const aiResponse = await generateAIResponse(userMessage, {
              walletAddress: address,
              balances: [],
              recentTransactions: [],
              conversationHistory
            })
            addMessage('ai', aiResponse)
        }
      } else {
        // Fallback to AI response if parsing fails
        const conversationHistory = messages
          .filter(msg => msg.type === 'user' || msg.type === 'ai')
          .slice(-6) // Keep last 6 messages
          .map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }))
        
        const aiResponse = await generateAIResponse(userMessage, {
          walletAddress: address,
          balances: [],
          recentTransactions: [],
          conversationHistory
        })
        addMessage('ai', aiResponse)
      }
    } catch (error) {
      console.error('Error processing command:', error)
      addMessage('ai', 'Sorry, I encountered an error processing your request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGetQuote = async (parsed: ParsedCommand) => {
    // Check if we're on Somnia chains
    if (selectedChain.id === 5031 || selectedChain.id === 50312) {
      try {
        const quote = await getSwapQuote(parsed.inputToken, parsed.outputToken, parsed.amount, selectedChain.id)
        
        // Store the parsed command with the quote for execution
        const quoteWithCommand = { ...quote, parsedCommand: parsed }
        
        // Store the pending swap for "yes" responses
        setPendingSwap(parsed)
        
        addMessage('ai', `🔄 **Quote for ${parsed.amount} ${parsed.inputToken} → ${parsed.outputToken}**

**Expected Output:** ${quote.toAmount} ${parsed.outputToken}
**Price Impact:** ${quote.priceImpact}
**Fee:** ${quote.fee}
**Gas Estimate:** ${quote.gasEstimate}

Would you like me to execute this swap?`, quoteWithCommand)
      } catch (error) {
        addMessage('ai', `❌ **Quote Error**

I encountered an error while getting the quote: ${error instanceof Error ? error.message : 'Unknown error'}

Please check that the tokens are valid and try again.`)
      }
      return
    }
    
    // For other chains, show development message
    addMessage('ai', `🔄 **Swap Request Detected**

I understand you want to swap ${parsed.amount} ${parsed.inputToken} to ${parsed.outputToken} on ${selectedChain.name}.

**Current Status:** Our native swap functionality is currently under development.

**What you can do:**
• Check real-time prices and token information
• Monitor your token balances
• Get updates on DEX deployment progress

Once our native swap functionality is ready, I'll be able to provide quotes and execute swaps directly through our interface.`)
  }

  const handleSwapToken = async (parsed: ParsedCommand) => {
    // Check if we're on Somnia chains
    if (selectedChain.id === 5031 || selectedChain.id === 50312) {
      if (!isConnected || !address) {
        addMessage('ai', `❌ **Wallet Not Connected**

Please connect your wallet to execute swaps on ${selectedChain.name}.`)
        return
      }

      try {
        const swapTx = await executeSwap(
          parsed.inputToken,
          parsed.outputToken,
          parsed.amount,
          parsed.slippageTolerance || 0.5,
          selectedChain.id,
          address
        )

        // Execute the swap transaction
        try {
          if (!walletClient) {
            throw new Error('Wallet not connected')
          }

          const hash = await walletClient.sendTransaction({
            to: swapTx.to as `0x${string}`,
            data: swapTx.data as `0x${string}`,
            value: BigInt(swapTx.value),
            gas: BigInt(swapTx.gasLimit)
          })

          addMessage('ai', `✅ **Swap Executed!**

**Transaction:** ${hash}
**From:** ${parsed.amount} ${parsed.inputToken}
**To:** ${swapTx.swapDetails?.toAmount} ${parsed.outputToken}

[View on Explorer](https://shannon-explorer.somnia.network/tx/${hash})`, null)
        } catch (error) {
          addMessage('ai', `❌ **Swap Failed**

${error instanceof Error ? error.message : 'Transaction failed'}

Try again or check your balance.`, null)
        }
      } catch (error) {
        addMessage('ai', `❌ **Swap Error**

I encountered an error while preparing the swap: ${error instanceof Error ? error.message : 'Unknown error'}

Please check your token balances and try again.`)
      }
      return
    }
    
    // For other chains, show development message
    addMessage('ai', `🔄 **Swap Execution Request**

I understand you want to execute a swap of ${parsed.amount} ${parsed.inputToken} to ${parsed.outputToken} on ${selectedChain.name}.

**Current Status:** Our native swap execution is currently under development.

**What you can do:**
• Check real-time prices and token information
• Monitor your token balances
• Get updates on DEX deployment progress

Once our native swap execution is ready, I'll be able to handle the entire swap process directly through our interface.`)
  }

  const handleCheckBalance = async (parsed: ParsedCommand) => {
    addMessage('ai', `I can help you check your ${parsed.inputToken} balance. 

For real-time balance updates, please use the wallet drawer or ask me to help you with specific trading operations.`)
  }

  const handleGetPrice = async (parsed: ParsedCommand) => {
    // Generate AI response with real-time price data
    const conversationHistory = messages
      .filter(msg => msg.type === 'user' || msg.type === 'ai')
      .slice(-6) // Keep last 6 messages
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    
    const aiResponse = await generateAIResponse(`What is the current price of ${parsed.inputToken}?`, {
      walletAddress: address,
      balances: [],
      recentTransactions: [],
      conversationHistory
    })
    addMessage('ai', aiResponse)
  }


  // Copy and edit functionality
  const copyMessage = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      // Reset back to copy icon after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const startEditing = (messageId: number, text: string) => {
    setEditingMessageId(messageId)
    setEditText(text)
  }

  const sendEditedMessage = async () => {
    if (editText.trim()) {
      // Close edit mode first
      setEditingMessageId(null)
      setEditText('')
      
      // Add the edited message as a user message
      addMessage('user', editText)
      setIsProcessing(true)
      
      try {
        // Parse command using OpenAI
        const parseResult = await parseCommand(editText)
        
        if (parseResult.success && parseResult.parsedCommand) {
          const parsed = parseResult.parsedCommand
          
          // Handle different actions
          switch (parsed.action) {
            case 'GET_QUOTE':
              await handleGetQuote(parsed)
              break
            case 'SWAP_TOKEN':
              await handleSwapToken(parsed)
              break
            case 'CHECK_BALANCE':
              await handleCheckBalance(parsed)
              break
            default:
              // Generate AI response for other queries
              const aiResponse = await generateAIResponse(editText, {
                walletAddress: address,
                balances: [],
                recentTransactions: []
              })
              addMessage('ai', aiResponse)
          }
        } else {
          // Fallback to AI response if parsing fails
          const aiResponse = await generateAIResponse(editText, {
            walletAddress: address,
            balances: [],
            recentTransactions: []
          })
          addMessage('ai', aiResponse)
        }
      } catch (error) {
        console.error('Error processing edited command:', error)
        addMessage('ai', 'Sorry, I encountered an error processing your edited request. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditText('')
  }


  // Generate chain-specific quick commands
  const getQuickCommands = (chain: ChainConfig) => {
    const nativeToken = chain.nativeCurrency.symbol
    const nativeTokenLower = nativeToken.toLowerCase()
    
    return [
      `Swap 1 ${nativeToken} for USDT`,
      `Get quote for 500 USDT to ${nativeToken}`,
      `Check my ${nativeToken} balance`,
      "What is Bitcoin price",
      "Show DeFi TVL",
      "Top yield farming opportunities",
      "How to swap",
      "Explain MEV protection"
    ]
  }

  const handleQuickCommand = (cmd: string) => {
    setCommand(cmd)
  }

  // Select a deterministic AI avatar based on wallet address
  const getAiAvatarSrc = (walletAddress?: string | undefined) => {
    if (!walletAddress) return "/images/ai-avatars/01.png"
    const hex = walletAddress.toLowerCase().replace("0x", "")
    let sum = 0
    for (let i = 0; i < hex.length; i++) sum += hex.charCodeAt(i)
    const index = (sum % 7) + 1
    const idx = String(index).padStart(2, "0")
    return `/images/ai-avatars/${idx}.png`
  }

  const aiAvatarSrc = getAiAvatarSrc(address)

  // Select a random user avatar per wallet and persist in localStorage
  const getUserAvatarSrc = (walletAddress?: string | undefined) => {
    const fallback = "/images/user-avatars/Betty.png"
    if (!walletAddress) return fallback
    try {
      const key = `xontra:user-avatar:${walletAddress.toLowerCase()}`
      const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      if (existing) return existing
      const options = [
        "Betty.png","Conan.png","Erick.png","Hannah.png","Janet.png","Jonas.png","Ruby.png","Tracy.png"
      ]
      const rand = Math.floor(Math.random() * options.length)
      const selected = `/images/user-avatars/${options[rand]}`
      if (typeof window !== 'undefined') localStorage.setItem(key, selected)
      return selected
    } catch {
      return fallback
    }
  }

  const userAvatarSrc = getUserAvatarSrc(address)


  return (
    <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-sm p-6 h-[700px] max-h-[700px] flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30 flex-shrink-0">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-500 via-purple-500 to-purple-500 bg-clip-text text-transparent">
          {title ?? "XONTRA PROMPT ENGINE"}
        </h2>
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-purple-500 animate-pulse" : "bg-red-400"}`}
          ></div>
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 mb-6 space-y-4 overflow-y-auto scrollbar-hide min-h-0">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === 'ai' ? (
              <div className="flex items-start gap-3">
                <img src={aiAvatarSrc} alt="Xontra AI" className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="flex flex-col items-start group">
                  <div className="max-w-md px-4 py-3 rounded-lg relative bg-slate-800/30 text-slate-200 border border-slate-700/30">
                    {editingMessageId === message.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border rounded resize-none bg-slate-700 text-white border-slate-600"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendEditedMessage()}
                            className="px-3 py-1 bg-purple-700 text-white rounded text-xs sm:text-sm hover:bg-purple-800 transition-colors"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => cancelEdit()}
                            className="px-3 py-1 bg-slate-600 text-white rounded text-xs sm:text-sm hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words overflow-hidden">
                        <div 
                          className="text-xs sm:text-sm" 
                          dangerouslySetInnerHTML={renderMessageContent(message.content)}
                        />
                        {message.quote && message.type === 'ai' && message.content.includes('Would you like me to execute this swap?') && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                handleSwapToken(message.quote!.parsedCommand || {
                                  action: 'SWAP_TOKEN',
                                  message: 'Execute swap',
                                  inputToken: message.quote!.fromToken.symbol,
                                  outputToken: message.quote!.toToken.symbol,
                                  amount: message.quote!.fromAmount,
                                  slippageTolerance: 0.5,
                                  deadline: 300,
                                  fee: 3000
                                })
                                setPendingSwap(null) // Clear pending swap
                              }}
                              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Yes, Execute
                            </button>
                            <button
                              onClick={() => addMessage('ai', 'Swap cancelled.')}
                              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content, message.id)}
                      className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
            <div className="flex flex-col items-start group">
              <div className="max-w-md px-4 py-3 rounded-lg relative bg-gradient-to-r from-purple-600/20 to-purple-600/20 text-purple-100 border border-purple-600/30">
                {editingMessageId === message.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border rounded resize-none bg-slate-700 text-white border-slate-600"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendEditedMessage()}
                        className="px-3 py-1 bg-purple-700 text-white rounded text-xs sm:text-sm hover:bg-purple-800 transition-colors"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => cancelEdit()}
                        className="px-3 py-1 bg-slate-600 text-white rounded text-xs sm:text-sm hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words overflow-hidden">
                    <div 
                      className="text-xs sm:text-sm" 
                      dangerouslySetInnerHTML={renderMessageContent(message.content)}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyMessage(message.content, message.id)}
                  className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                  title="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                {message.type === "user" && (
                  <button
                    onClick={() => startEditing(message.id, message.content)}
                    className="p-1 text-gray-400 hover:text-purple-500 transition-colors"
                    title="Edit message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
                <img src={userAvatarSrc} alt="You" className="w-10 h-10 rounded-lg flex-shrink-0" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/30 text-slate-200 border border-slate-700/30 max-w-xs px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0">
        {isInputFocused && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
              {getQuickCommands(selectedChain).map((cmd: string) => (
              <button
                key={cmd}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleQuickCommand(cmd)
                }}
                className="px-3 py-2 bg-slate-800/30 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-purple-600/20 rounded-full border border-slate-700/50 hover:border-purple-600/50 transition-all text-xs sm:text-sm text-slate-300 hover:text-white"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 focus-within:border-purple-600/50 focus-within:bg-gradient-to-r focus-within:from-purple-600/10 focus-within:to-purple-600/10 transition-all">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Type your command or question..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
              disabled={isProcessing || isExecutingSwap}
            />
            <Button
              type="submit"
              disabled={isProcessing || !command.trim() || !isConnected || isExecutingSwap || !walletClient}
              className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-black h-8 w-8 p-0 disabled:opacity-50 rounded-lg"
            >
              {isProcessing || isExecutingSwap ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
