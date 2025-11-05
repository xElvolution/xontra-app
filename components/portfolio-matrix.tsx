"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, MoreHorizontal, Eye, Plus } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { useEffect, useState, useCallback } from "react"
import { getSomniaTokenBalances, getNativeTokenPrice, type TokenBalance } from "@/lib/somniascan"
import { type ChainConfig } from "@/lib/chains"

interface PortfolioMatrixProps {
  selectedChain?: ChainConfig
}

interface PnLData {
  previousValue: number
  timestamp: number
}

export function PortfolioMatrix({ selectedChain }: PortfolioMatrixProps) {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const [tokens, setTokens] = useState<TokenBalance[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  const [pnl, setPnl] = useState<{ change: number; percentage: number } | null>(null)

  // Get token logo URL
  const getTokenLogo = (symbol: string, chainId: number): string => {
    if (symbol === 'STT' || symbol === 'WSTT' || symbol === 'SOMI') {
      // Use Somnia chain logo (testnet or mainnet)
      return `/images/chains/${chainId}.png`
    }
    if (symbol === 'USDT') {
      return '/images/usdt.png'
    }
    if (symbol === 'XON') {
      return '/logo.png' // Xontra logo
    }
    return '' // Fallback to colored circle
  }

  // Token colors mapping (fallback)
  const tokenColors: Record<string, string> = {
    STT: "bg-purple-500",
    SOMI: "bg-purple-500",
    WSTT: "bg-purple-600",
    USDT: "bg-emerald-500",
    XON: "bg-pink-500",
  }

  // Token prices (from somniascan.ts logic)
  const getTokenPrice = (symbol: string): number => {
    if (tokenPrices[symbol] !== undefined) return tokenPrices[symbol]
    if (symbol === 'WSTT' || symbol === 'STT') return 3.65
    if (symbol === 'USDT') return 1.0
    if (symbol === 'XON') return 0.01
    if (symbol === 'SOMI') return 0.01
    return 0
  }

  // Load PnL data from localStorage
  const loadPnLData = (): PnLData | null => {
    if (typeof window === 'undefined' || !address) return null
    try {
      const key = `xontra:pnl:${address.toLowerCase()}`
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data) as PnLData
        // Only use if less than 24 hours old
        const hoursAgo = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        if (hoursAgo < 24) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error loading PnL data:', e)
    }
    return null
  }

  // Save PnL data to localStorage
  const savePnLData = (value: number) => {
    if (typeof window === 'undefined' || !address) return
    try {
      const key = `xontra:pnl:${address.toLowerCase()}`
      const data: PnLData = {
        previousValue: value,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error('Error saving PnL data:', e)
    }
  }

  const fetchPortfolioData = useCallback(async () => {
    if (!isConnected || !address) {
      setTokens([])
      setTotalValue(0)
      setPnl(null)
      return
    }

    setIsLoading(true)
    try {
      const currentChainId = selectedChain?.id || chainId
      const [tokenData, nativePrice] = await Promise.all([
        getSomniaTokenBalances(address, currentChainId),
        getNativeTokenPrice(currentChainId)
      ])

      // Set token prices
      const prices: Record<string, number> = {}
      tokenData.forEach(token => {
        if (token.usdValue !== undefined && parseFloat(token.balance) > 0) {
          prices[token.tokenSymbol] = token.usdValue / parseFloat(token.balance)
        } else {
          prices[token.tokenSymbol] = getTokenPrice(token.tokenSymbol)
        }
      })
      setTokenPrices(prices)

      setTokens(tokenData)
      
      // Calculate total portfolio value
      const total = tokenData.reduce((sum, token) => sum + (token.usdValue || 0), 0)
      
      // Calculate PnL
      const previousPnL = loadPnLData()
      if (previousPnL && previousPnL.previousValue > 0) {
        const change = total - previousPnL.previousValue
        const percentage = (change / previousPnL.previousValue) * 100
        setPnl({ change, percentage })
      } else {
        setPnl(null)
      }
      
      // Save current value for next calculation
      savePnLData(total)
      setTotalValue(total)
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, chainId, selectedChain?.id])

  useEffect(() => {
    fetchPortfolioData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolioData, 30000)
    return () => clearInterval(interval)
  }, [fetchPortfolioData])

  // Format token amount based on decimals
  const formatTokenAmount = (balance: string, symbol: string): string => {
    const amount = parseFloat(balance)
    if (amount === 0) return "0.0000"
    
    // Different decimal places for different tokens
    if (symbol === 'USDT' || symbol === 'XON') {
      return amount.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  }

  // Calculate percentage of portfolio
  const getPortfolioPercentage = (tokenValue: number): string => {
    if (totalValue === 0) return "0%"
    const percentage = (tokenValue / totalValue) * 100
    return `${percentage.toFixed(1)}%`
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Header */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-slate-900" />
            </div>
            <h2 className="text-lg font-bold text-white">PORTFOLIO</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Eye className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={fetchPortfolioData}
              disabled={isLoading}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <div className="text-2xl font-bold text-white">
            {isLoading ? (
              <span className="text-slate-500">Loading...</span>
            ) : isConnected ? (
              `$${totalValue.toFixed(2)}`
            ) : (
              "$0.00"
            )}
          </div>
          {isConnected && !isLoading && pnl && (
            <div className={`text-sm font-medium flex items-center gap-1 ${pnl.change >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
              {pnl.change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {pnl.change >= 0 ? '+' : ''}${pnl.change.toFixed(2)} ({pnl.percentage >= 0 ? '+' : ''}{pnl.percentage.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-slate-400 text-xs">
            {isConnected 
              ? "Total Portfolio Value • Somnia Chain"
              : "Connect wallet to view portfolio"
            }
          </div>
          {isConnected && !isLoading && pnl && (
            <div className={`px-3 py-1 rounded-full border text-xs font-medium ${
              pnl.change >= 0 
                ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' 
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}>
              {pnl.change >= 0 ? '+' : ''}{pnl.percentage.toFixed(2)}% PnL
            </div>
          )}
        </div>
      </Card>

      {/* Token Holdings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800 p-3 animate-pulse">
              <div className="h-20 bg-slate-800/50 rounded"></div>
            </Card>
          ))}
        </div>
      ) : !isConnected ? (
        <Card className="bg-slate-900/50 border-slate-800 p-6 text-center">
          <p className="text-slate-400 text-sm">Connect your wallet to view token balances</p>
        </Card>
      ) : tokens.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800 p-6 text-center">
          <p className="text-slate-400 text-sm">No tokens found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tokens.map((token) => {
            const tokenValue = token.usdValue || 0
            const price = getTokenPrice(token.tokenSymbol)
            const color = tokenColors[token.tokenSymbol] || "bg-slate-500"
            const logoUrl = getTokenLogo(token.tokenSymbol, token.chainId)
            
            return (
              <Card
                key={`${token.contractAddress}-${token.chainId}`}
                className="bg-slate-900/50 border-slate-800 p-3 hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img 
                        src={logoUrl}
                        alt={token.tokenSymbol}
                        className="w-8 h-8 rounded-full ring-2 ring-slate-700/50"
                        onError={(e) => {
                          // Fallback to colored circle if logo fails
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-8 h-8 ${color} rounded-full flex items-center justify-center ${logoUrl ? 'hidden' : ''}`}
                    >
                      <span className="text-white font-bold text-xs">{token.tokenSymbol.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{token.tokenSymbol}</h3>
                      <p className="text-slate-400 text-xs">${price.toFixed(4)}</p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition-all">
                    <MoreHorizontal className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {formatTokenAmount(token.balance, token.tokenSymbol)}
                    </div>
                    <div className="text-slate-400 text-xs">
                      ${tokenValue.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {getPortfolioPercentage(tokenValue)} of portfolio
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
