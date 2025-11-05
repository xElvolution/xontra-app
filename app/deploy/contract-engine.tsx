"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { generateAIResponse } from '@/lib/openai-client'
import { SUPPORTED_CHAINS, type ChainConfig } from '@/lib/chains'

interface DeploymentParams {
  name?: string
  symbol?: string
  supply?: string
  contractType?: 'ERC20' | 'ERC721' | 'ERC1155' | 'Custom'
}

export function ContractEngine({ selectedChain }: { selectedChain: ChainConfig }) {
  const [command, setCommand] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [deploymentParams, setDeploymentParams] = useState<DeploymentParams>({})
  const [askingFor, setAskingFor] = useState<'name' | 'symbol' | 'supply' | null>(null)
  const [pendingDeployment, setPendingDeployment] = useState<{ code: string; params: DeploymentParams } | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
  }>>([
    {
      id: Date.now(),
      type: "ai",
      content: "Hi there! I'm XONTRA, your AI contract deployment assistant. I can help you deploy, compile, and verify smart contracts on the Somnia blockchain. I can assist with contract creation, testing, and deployment to testnet or mainnet.\n\n**You can:**\n- Deploy a new ERC20 token (I'll guide you through it)\n- Paste your own Solidity contract code and deploy it directly\n- Get help with contract compilation and verification\n\nHow can I help you deploy today?",
      timestamp: new Date(),
    },
  ])
  
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

  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage = {
      id: Date.now() + Math.random(), // Ensure unique ID
      type,
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Function to render markdown-like content as HTML
  const renderMessageContent = (content: string) => {
    // Convert code blocks first (before other processing)
    let html = content.replace(/```solidity\n([\s\S]*?)```/g, '<pre class="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 my-2 overflow-x-auto"><code class="text-xs text-slate-300">$1</code></pre>')
    html = html.replace(/```\n([\s\S]*?)```/g, '<pre class="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 my-2 overflow-x-auto"><code class="text-xs text-slate-300">$1</code></pre>')
    
    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800/50 px-1.5 py-0.5 rounded text-xs text-purple-300">$1</code>')
    
    // Convert **text** to <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    
    // Convert [text](url) to <a> links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-500 hover:text-purple-400 underline">$1</a>')
    
    // Convert line breaks to <br>
    html = html.replace(/\n/g, '<br>')
    
    return { __html: html }
  }

  // Extract contract code from pasted text (code blocks or plain text)
  const extractContractCode = (text: string): string | null => {
    // Check for Solidity code blocks
    const solidityBlockMatch = text.match(/```solidity\n([\s\S]*?)```/i)
    if (solidityBlockMatch) {
      return solidityBlockMatch[1].trim()
    }
    
    // Check for generic code blocks
    const codeBlockMatch = text.match(/```\n([\s\S]*?)```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }
    
    // Check if the text contains Solidity keywords (likely a contract)
    if (text.includes('pragma solidity') || text.includes('contract ') || text.includes('interface ') || text.includes('library ')) {
      return text.trim()
    }
    
    return null
  }

  // Extract contract name from Solidity code
  const extractContractName = (code: string): string | null => {
    // Match contract definitions: contract ContractName, contract ContractName is, etc.
    const contractMatch = code.match(/contract\s+([A-Za-z0-9_]+)(?:\s+is|\s*\{)/)
    if (contractMatch && contractMatch[1]) {
      return contractMatch[1]
    }
    
    // Match interface definitions
    const interfaceMatch = code.match(/interface\s+([A-Za-z0-9_]+)(?:\s+is|\s*\{)/)
    if (interfaceMatch && interfaceMatch[1]) {
      return interfaceMatch[1]
    }
    
    // Match library definitions
    const libraryMatch = code.match(/library\s+([A-Za-z0-9_]+)(?:\s+is|\s*\{)/)
    if (libraryMatch && libraryMatch[1]) {
      return libraryMatch[1]
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || isProcessing) return

    const userMessage = command.trim()
    addMessage('user', userMessage)
    setCommand("")
    setIsProcessing(true)

    try {
      // Check if we're in a deployment conversation flow
      if (askingFor) {
        handleDeploymentAnswer(userMessage, askingFor)
        return
      }

      // Check if user wants to deploy the contract
      if (pendingDeployment && (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('deploy') || userMessage.toLowerCase().includes('confirm'))) {
        await handleDeployContract(pendingDeployment.code, pendingDeployment.params)
        setPendingDeployment(null)
        return
      }

      // Check if user pasted contract code
      const contractCode = extractContractCode(userMessage)
      if (contractCode) {
        const contractName = extractContractName(contractCode)
        
        if (contractName) {
          // Ask for confirmation to deploy
          setPendingDeployment({
            code: contractCode,
            params: {
              contractType: 'Custom',
              name: contractName
            }
          })
          addMessage('ai', `🔍 **Contract Detected!**\n\nI found a Solidity contract: **${contractName}**\n\n**Ready to deploy to Somnia ${selectedChain.name} (Chain ID: ${selectedChain.id})**\n\nWould you like me to deploy this contract now? Just type "yes" or "deploy" to proceed!`)
          setIsProcessing(false)
          return
        } else {
          addMessage('ai', `⚠️ **Contract Code Detected**\n\nI found Solidity code, but couldn't detect the contract name. Please make sure your contract follows this format:\n\n\`\`\`solidity\ncontract MyContract {\n    // ...\n}\n\`\`\`\n\nOr specify the contract name manually.`)
          setIsProcessing(false)
          return
        }
      }

      // Check if user wants to deploy a token
      const lowerMessage = userMessage.toLowerCase()
      if (lowerMessage.includes('deploy') && (lowerMessage.includes('token') || lowerMessage.includes('erc20'))) {
        startDeploymentFlow()
        return
      }

      // Check if user wants to paste and deploy a custom contract
      if (lowerMessage.includes('paste') && lowerMessage.includes('deploy') && lowerMessage.includes('contract')) {
        addMessage('ai', `📋 **Ready to Deploy Your Contract!**\n\nPlease paste your Solidity contract code below. You can paste it:\n\n1. **In a code block:**\n\`\`\`solidity\ncontract MyContract {\n    // ...\n}\n\`\`\`\n\n2. **As plain text** (I'll detect it automatically)\n\nJust paste your contract code and I'll extract the contract name and deploy it for you!`)
        setIsProcessing(false)
        return
      }

      // Generate AI response for contract deployment queries
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
    } catch (error) {
      console.error('Error processing command:', error)
      addMessage('ai', 'Sorry, I encountered an error processing your request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const startDeploymentFlow = () => {
    setAskingFor('name')
    setDeploymentParams({ contractType: 'ERC20' })
    addMessage('ai', `Great! I'll help you deploy an ERC20 token. Let me gather some information from you.\n\n**What would you like to name your token?**\n(e.g., "MyToken", "CoolToken", "XontraToken")`)
    setIsProcessing(false)
  }

  const handleDeploymentAnswer = (answer: string, field: 'name' | 'symbol' | 'supply') => {
    const updatedParams = { ...deploymentParams }

    if (field === 'name') {
      updatedParams.name = answer
      setDeploymentParams(updatedParams)
      setAskingFor('symbol')
      addMessage('ai', `Perfect! Token name: **${answer}**\n\n**What symbol would you like for your token?**\n(e.g., "MTK", "CTK", "XON")`)
    } else if (field === 'symbol') {
      // Validate symbol (usually 2-10 characters, uppercase)
      const symbol = answer.toUpperCase().trim()
      if (symbol.length < 2 || symbol.length > 10) {
        addMessage('ai', `The symbol should be between 2-10 characters. Please provide a valid symbol:\n(e.g., "MTK", "CTK", "XON")`)
        setIsProcessing(false)
        return
      }
      updatedParams.symbol = symbol
      setDeploymentParams(updatedParams)
      setAskingFor('supply')
      addMessage('ai', `Great! Token symbol: **${symbol}**\n\n**What is the total supply of your token?**\n(e.g., "1000000", "1000000000", "1000000000000000000")`)
    } else if (field === 'supply') {
      // Validate supply (should be a valid number)
      const supply = answer.trim()
      if (!/^\d+$/.test(supply) || BigInt(supply) <= 0n) {
        addMessage('ai', `Please provide a valid positive number for the total supply:\n(e.g., "1000000", "1000000000")`)
        setIsProcessing(false)
        return
      }
      updatedParams.supply = supply
      setDeploymentParams(updatedParams)
      setAskingFor(null)
      
      // Generate contract code
      generateContractCode(updatedParams)
    }

    setIsProcessing(false)
  }

  const generateContractCode = (params: DeploymentParams) => {
    if (!params.name || !params.symbol || !params.supply) {
      addMessage('ai', 'I need all the information to generate the contract. Let\'s start over.')
      startDeploymentFlow()
      return
    }

    const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ${params.name.replace(/[^a-zA-Z0-9]/g, '')} is ERC20 {
    constructor() ERC20("${params.name}", "${params.symbol}") {
        _mint(msg.sender, ${params.supply} * 10**decimals());
    }
}`

    const simpleContractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ${params.name.replace(/[^a-zA-Z0-9]/g, '')} {
    string public name = "${params.name}";
    string public symbol = "${params.symbol}";
    uint8 public decimals = 18;
    uint256 public totalSupply = ${params.supply} * 10**18;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}`

    // Store for deployment
    setPendingDeployment({ code: simpleContractCode, params })
    
    addMessage('ai', `Excellent! Here's your ERC20 token contract:\n\n\`\`\`solidity\n${simpleContractCode}\n\`\`\`\n\n**Deployment Summary:**\n- **Name:** ${params.name}\n- **Symbol:** ${params.symbol}\n- **Total Supply:** ${params.supply} ${params.symbol}\n- **Decimals:** 18\n\n**Ready to deploy to Somnia ${selectedChain.name} (Chain ID: ${selectedChain.id})**\n\nWould you like me to deploy this contract now? Just type "yes" or "deploy" to proceed!`)
    
    // Reset deployment params
    setDeploymentParams({})
  }

  const handleDeployContract = async (contractCode: string, params: DeploymentParams) => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      addMessage('ai', '❌ **Wallet Not Connected**\n\nPlease connect your wallet to deploy contracts.')
      setIsProcessing(false)
      return
    }

    setIsDeploying(true)
    addMessage('ai', '🔄 **Compiling contract...**\n\nThis may take a few moments. Please wait.')

    try {

      // Compile contract using API route
      // Use the contract name from params (for custom contracts) or fallback to Token
      const contractName = params.name?.replace(/[^a-zA-Z0-9]/g, '') || 
                          extractContractName(contractCode)?.replace(/[^a-zA-Z0-9]/g, '') || 
                          'Token'
      
      const compileResponse = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: contractCode,
          contractName: contractName
        })
      })

      if (!compileResponse.ok) {
        const errorData = await compileResponse.json()
        addMessage('ai', `⚠️ **Compilation Unavailable**\n\n${errorData.error || 'Automatic compilation is currently unavailable.'}\n\n**To deploy manually:**\n\n1. Copy the contract code above\n2. Go to [Remix IDE](https://remix.ethereum.org)\n3. Compile the contract (Ctrl+S)\n4. Deploy using Remix with your wallet connected to Somnia ${selectedChain.name}\n\nOr try again in a moment - the service may be temporarily unavailable.`)
        setIsDeploying(false)
        setIsProcessing(false)
        return
      }

      const { bytecode, abi } = await compileResponse.json()

      addMessage('ai', '✅ **Contract compiled successfully!**\n\n🚀 **Deploying to Somnia blockchain...**\n\nPlease confirm the transaction in your wallet.')

      // Deploy using wagmi's walletClient (viem)
      const hash = await walletClient.deployContract({
        abi,
        bytecode: bytecode as `0x${string}`,
        args: [],
        account: address as `0x${string}`
      })
      
      addMessage('ai', `⏳ **Deployment Transaction Sent!**\n\n**Transaction Hash:** ${hash}\n\nWaiting for confirmation...`)

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success' && receipt.contractAddress) {
        // Build deployment details message based on contract type
        let deploymentDetails = `**Contract Address:** ${receipt.contractAddress}\n**Transaction Hash:** ${hash}\n**Block Number:** ${receipt.blockNumber}\n\n`
        
        if (params.contractType === 'ERC20' && params.name && params.symbol && params.supply) {
          deploymentDetails += `**Deployment Details:**\n- **Name:** ${params.name}\n- **Symbol:** ${params.symbol}\n- **Total Supply:** ${params.supply} ${params.symbol}\n\n`
        } else if (params.name) {
          deploymentDetails += `**Contract Name:** ${params.name}\n\n`
        }
        
        deploymentDetails += `[View on Explorer](${selectedChain.blockExplorerUrls[0]}/address/${receipt.contractAddress})\n\n🎉 Your contract is now live on the Somnia blockchain!`
        
        addMessage('ai', `✅ **Contract Deployed Successfully!**\n\n${deploymentDetails}`)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error: any) {
      console.error('Deployment error:', error)
      addMessage('ai', `❌ **Deployment Failed**\n\n${error?.message || 'An error occurred during deployment. Please try again.'}\n\n**Possible reasons:**\n- Insufficient balance for gas fees\n- Network connection issues\n- Contract compilation error\n\nPlease check your wallet balance and try again.`)
    } finally {
      setIsDeploying(false)
      setIsProcessing(false)
    }
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
      const editedText = editText.trim()
      setEditText('')
      
      // Add the edited message as a user message
      addMessage('user', editedText)
      setIsProcessing(true)
      
      try {
        // Generate AI response for edited command
        const conversationHistory = messages
          .filter(msg => msg.type === 'user' || msg.type === 'ai')
          .slice(-6)
          .map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }))
        
        const aiResponse = await generateAIResponse(editedText, {
          walletAddress: address,
          balances: [],
          recentTransactions: [],
          conversationHistory
        })
        addMessage('ai', aiResponse)
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

  // Generate chain-specific quick commands for deployment
  const getQuickCommands = (chain: ChainConfig) => {
    return [
      "Deploy a simple ERC20 token",
      "Paste and deploy custom contract",
      "Verify contract on explorer",
      "Compile Solidity contract",
      "How to deploy contracts",
      "Show deployment examples"
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
          XONTRA CONTRACT ENGINE
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
              disabled={isProcessing}
            />
            <Button
              type="submit"
              disabled={isProcessing || !command.trim() || !isConnected || !walletClient}
              className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-black h-8 w-8 p-0 disabled:opacity-50 rounded-lg"
            >
              {isProcessing || isDeploying ? (
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
