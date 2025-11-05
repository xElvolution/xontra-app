"use client"

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { Navigation } from '@/components/navigation'
import { WalletDrawer } from '@/components/wallet-drawer'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUPPORTED_CHAINS, type ChainConfig } from '@/lib/chains'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'

// Contract addresses
const XON_ADDRESS = '0x2be4D53C9DCE1c95c625bf7b5f058F385F56EC09'
const USDT_ADDRESS = '0xd7BFAfA0573236528e86A37D529938422c2FC631'

// Simple ABI for the getTokens function (payable fallback)
const FAUCET_ABI = [
  {
    inputs: [],
    name: 'getTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    stateMutability: 'payable',
    type: 'fallback'
  }
] as const

interface TokenInfo {
  symbol: string
  address: string
  name: string
  logo: string
  decimals: number
  freeAmount: string
  ratePerSTT: string
}

const TOKENS: TokenInfo[] = [
  {
    symbol: 'XON',
    address: XON_ADDRESS,
    name: 'Xontra AI',
    logo: '/logo.png',
    decimals: 9,
    freeAmount: '1',
    ratePerSTT: '10'
  },
  {
    symbol: 'USDT',
    address: USDT_ADDRESS,
    name: 'Testnet USD',
    logo: '/images/usdt.png',
    decimals: 9,
    freeAmount: '100',
    ratePerSTT: '1000'
  }
]

export default function FaucetPage() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(SUPPORTED_CHAINS[0])
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false)
  const [sttAmount, setSttAmount] = useState<string>('0')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [balances, setBalances] = useState<Record<string, string>>({})

  const handleChainChange = (chain: ChainConfig) => {
    setSelectedChain(chain)
  }

  const handleWalletClick = () => {
    setIsWalletDrawerOpen(true)
  }

  useEffect(() => {
    // Find the chain matching the connected chainId
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
    if (chain) {
      setSelectedChain(chain)
    }
  }, [chainId])

  // Calculate tokens to receive
  const calculateTokens = (token: TokenInfo, sttAmount: string): string => {
    const stt = parseFloat(sttAmount) || 0
    if (stt === 0) {
      return token.freeAmount
    }
    const tokens = parseFloat(token.freeAmount) + (stt * parseFloat(token.ratePerSTT))
    return tokens.toFixed(2)
  }

  // Request tokens from faucet
  const requestTokens = async (token: TokenInfo) => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast.error('Please connect your wallet')
      return
    }

    if (selectedChain.id !== 50312) {
      toast.error('Faucet is only available on Somnia Testnet')
      return
    }

    try {
      setLoading(prev => ({ ...prev, [token.symbol]: true }))

      const sttValue = parseFloat(sttAmount) || 0
      const value = parseUnits(sttAmount || '0', 18)

      // Call getTokens() function or send with empty data to trigger payable fallback
      // The contract has a payable fallback that calls getTokens()
      const hash = await walletClient.sendTransaction({
        to: token.address as `0x${string}`,
        value: value,
        // Empty data triggers the payable fallback which calls getTokens()
        data: '0x' as `0x${string}`
      })

      toast.success(`Transaction sent! Waiting for confirmation...`)

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        const tokensToReceive = calculateTokens(token, sttAmount)
        toast.success(`Successfully received ${tokensToReceive} ${token.symbol}!`)
        
        // Refresh balances after a short delay
        setTimeout(() => {
          fetchBalance(token)
        }, 2000)
      } else {
        toast.error('Transaction failed')
      }
    } catch (error: any) {
      console.error('Error requesting tokens:', error)
      toast.error(error?.message || 'Failed to request tokens')
    } finally {
      setLoading(prev => ({ ...prev, [token.symbol]: false }))
    }
  }

  // Fetch token balance
  const fetchBalance = async (token: TokenInfo) => {
    if (!address || !publicClient) return

    try {
      const balance = await publicClient.readContract({
        address: token.address as `0x${string}`,
        abi: [
          {
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      })

      const formatted = formatUnits(balance as bigint, token.decimals)
      setBalances(prev => ({ ...prev, [token.symbol]: formatted }))
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  useEffect(() => {
    if (isConnected && address && publicClient) {
      TOKENS.forEach(token => {
        fetchBalance(token)
      })
    }
  }, [isConnected, address, publicClient])

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black text-white relative overflow-hidden flex flex-col">
      <Navigation onWalletClick={handleWalletClick} onChainChange={handleChainChange} />
      <WalletDrawer 
        isOpen={isWalletDrawerOpen} 
        onClose={() => setIsWalletDrawerOpen(false)} 
        selectedChain={selectedChain} 
      />
      <div className="flex-1 pt-16 md:pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Token Faucet</h1>
            <p className="text-slate-300">
              Get free test tokens on Somnia Testnet. Send STT to receive tokens (0 STT for free tokens).
            </p>
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
              <div className="text-center">
                <p className="text-slate-300 mb-4">Please connect your wallet to use the faucet</p>
              </div>
            </Card>
          ) : selectedChain.id !== 50312 ? (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
              <div className="text-center">
                <p className="text-slate-300 mb-4">⚠️ Faucet is only available on Somnia Testnet</p>
                <p className="text-sm text-slate-400">Please switch to Somnia Testnet (Chain ID: 50312)</p>
              </div>
            </Card>
          ) : (
            <>
              {/* STT Amount Input */}
              <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  STT Amount to Send (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={sttAmount}
                    onChange={(e) => setSttAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setSttAmount('0')}
                    className="border-slate-700 text-slate-300"
                  >
                    Free (0 STT)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSttAmount('1')}
                    className="border-slate-700 text-slate-300"
                  >
                    1 STT
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Send 0 STT for free tokens, or send STT to get more tokens
                </p>
              </Card>

              {/* Token Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {TOKENS.map((token) => {
                  const tokensToReceive = calculateTokens(token, sttAmount)
                  const isLoading = loading[token.symbol] || false
                  const balance = balances[token.symbol] || '0'

                  return (
                    <Card
                      key={token.symbol}
                      className="p-6 bg-slate-800/50 border-slate-700 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png'
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{token.name}</h3>
                          <p className="text-sm text-slate-400">{token.symbol}</p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">You'll Receive:</span>
                          <span className="text-2xl font-bold text-purple-400">
                            {tokensToReceive} {token.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Your Balance:</span>
                          <span className="text-lg font-semibold text-white">
                            {parseFloat(balance).toFixed(2)} {token.symbol}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {sttAmount === '0' || sttAmount === '' ? (
                              <>Free: {token.freeAmount} {token.symbol}</>
                            ) : (
                              <>
                                {token.freeAmount} {token.symbol} (free) + {parseFloat(sttAmount) * parseFloat(token.ratePerSTT)} {token.symbol} ({sttAmount} STT × {token.ratePerSTT})
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => requestTokens(token)}
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Processing...
                          </span>
                        ) : (
                          `Request ${tokensToReceive} ${token.symbol}`
                        )}
                      </Button>

                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Contract: {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </p>
                    </Card>
                  )
                })}
              </div>

              {/* Info Box */}
              <Card className="p-6 bg-slate-800/50 border-slate-700 mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">📝 How it works</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Send 0 STT to get free tokens (1 XON or 100 USDT)</li>
                  <li>• Send 1 STT to get more tokens (10 XON or 1000 USDT)</li>
                  <li>• You can send any amount of STT to get proportional tokens</li>
                  <li>• Free tokens are available once per address</li>
                  <li>• The STT you send goes to the contract address</li>
                </ul>
              </Card>
            </>
          )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}


