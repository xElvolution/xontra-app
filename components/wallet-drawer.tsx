"use client"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { getRecentTransactions, getNativeTokenPrice, getSomniaTokenBalances, type Transaction, type TokenBalance } from '@/lib/somniascan'
import {
  ChevronRight,
  Settings,
  Power,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react"

import { type ChainConfig } from "@/lib/chains"

interface WalletDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedChain: ChainConfig
}

export function WalletDrawer({ isOpen, onClose, selectedChain }: WalletDrawerProps) {
  const { isConnected, address } = useAccount()
  const { data: balance } = useBalance({
    address: address,
    chainId: selectedChain.id,
  })
  const { disconnect } = useDisconnect()
  const [activeTab, setActiveTab] = useState("tokens")
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Real data states
  const [tokens, setTokens] = useState<TokenBalance[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ethPrice, setEthPrice] = useState(2800)
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAllTransactions, setShowAllTransactions] = useState(false)

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

  // Fetch balances first (fast)
  const fetchBalances = useCallback(async () => {
    if (!address) return
    
    try {
      // Fetch balances and price only (fast)
      const [tokenData, priceData] = await Promise.all([
        getSomniaTokenBalances(address, selectedChain.id),
        getNativeTokenPrice(selectedChain.id)
      ])
      
      console.log(`Fetched ${tokenData.length} tokens for chain ${selectedChain.id}:`, tokenData.map(t => `${t.tokenSymbol} (${t.balance})`))
      setTokens(tokenData)
      setEthPrice(priceData)
      
      // Calculate total portfolio value from Somnia tokens
      const totalValue = tokenData.reduce((sum, token) => sum + (token.usdValue || 0), 0)
      setTotalPortfolioValue(totalValue)
    } catch (error) {
      console.error('Error fetching Somnia wallet balances:', error)
    }
  }, [address, selectedChain.id])

  // Fetch transactions separately (can be slow)
  const fetchTransactions = useCallback(async () => {
    if (!address) return
    
    setIsLoadingTransactions(true)
    try {
      const txData = await getRecentTransactions(address, 1, 100, selectedChain.id)
      setTransactions(txData)
    } catch (error) {
      console.error('Error fetching Somnia wallet transactions:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [address, selectedChain.id])

  // Fetch all data (for refresh)
  const fetchWalletData = useCallback(async () => {
    if (!address) return
    
    setIsRefreshing(true)
    try {
      await fetchBalances()
      await fetchTransactions()
    } catch (error) {
      console.error('Error refreshing wallet data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [address, fetchBalances, fetchTransactions])

  // Fetch real data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // Fetch balances first (fast)
      setIsLoading(true)
      fetchBalances().finally(() => setIsLoading(false))
      
      // Then fetch transactions in the background (can be slow)
      fetchTransactions()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchWalletData()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, address, fetchBalances, fetchTransactions, fetchWalletData])

  const copyAddress = async () => {
    if (typeof window === "undefined") return

    try {
      await navigator.clipboard.writeText(address || "")
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error("Failed to copy address:", error)
    }
  }

  const openBlockExplorer = () => {
    if (typeof window === "undefined") return
    const explorerUrl = selectedChain.blockExplorerUrls[0]
    window.open(`${explorerUrl}/address/${address}`, "_blank")
  }

  const disconnectWallet = () => {
    disconnect()
    onClose()
  }

  const openTransactionOnBlockExplorer = (txHash: string) => {
    const explorerUrl = selectedChain.blockExplorerUrls[0]
    window.open(`${explorerUrl}/tx/${txHash}`, "_blank")
  }

  const formatTransactionType = (tx: Transaction): string => {
    if (tx.functionName && tx.functionName.includes('transfer')) return 'Transfer'
    if (tx.functionName && tx.functionName.includes('swap')) return 'Swap'
    if (tx.functionName && tx.functionName.includes('approve')) return 'Approve'
    if (tx.functionName && tx.functionName.includes('Contract Interaction')) return 'Contract Interaction'
    if (tx.value === '0') return 'Contract Interaction'
    return 'Transfer'
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp) * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              {/* User avatar matching chat prompt engine */}
            <div className="relative">
                <img src={userAvatarSrc} alt="You" className="w-10 h-10 rounded-lg" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-slate-900"></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchWalletData}
                disabled={isRefreshing}
                className="h-8 w-8 p-0 text-slate-400 hover:text-purple-500 hover:bg-slate-800/50 rounded-full transition-all duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-full transition-all duration-200"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectWallet}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-full transition-all duration-200"
                title="Disconnect wallet"
              >
                <Power className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isConnected && (
              <div>
                {isLoading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-white font-medium mb-2 text-sm">Loading wallet data...</h3>
                     <p className="text-slate-400 text-xs">Fetching tokens from Somnia chain and recent activity</p>
                  </div>
                )}
                
                {!isLoading && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div 
                      className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/50 rounded-full px-4 py-2 cursor-pointer hover:from-purple-900/40 hover:to-purple-900/40 hover:border-purple-600/50 transition-all duration-300 backdrop-blur-sm group"
                      onClick={copyAddress}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse group-hover:bg-purple-500 transition-colors duration-300"></div>
                        <span className="text-slate-300 text-sm font-mono font-medium group-hover:text-white transition-colors duration-300">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
                        </span>
                        <div className="w-4 h-4 bg-slate-600/50 rounded-full flex items-center justify-center group-hover:bg-purple-600/20 transition-colors duration-300">
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-purple-500 transition-colors duration-300" />
                        </div>
                    </div>
                    </div>
                  </div>

                                     <div className="text-center mb-8">
                     <div className="relative">
                       <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-purple-500 to-blue-400 bg-clip-text text-transparent mb-2">
                         ${totalPortfolioValue.toFixed(2)}
                       </div>
                       <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-purple-500/20 to-blue-400/20 rounded-lg blur-sm -z-10"></div>
                    </div>
                     <div className="text-slate-400 text-xs font-medium">
                      {isRefreshing && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                           <span>Updating portfolio...</span>
                        </div>
                      )}
                    </div>
                  </div>



                  <div className="flex bg-slate-800/30 rounded-xl p-1 mb-6 border border-slate-700/50">
                    {["Tokens", "Activity"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                                                 className={`flex-1 px-4 py-3 text-xs font-semibold transition-all duration-300 rounded-lg ${
                          activeTab === tab.toLowerCase()
                            ? "text-white bg-gradient-to-r from-purple-600/20 to-purple-600/20 border border-purple-600/30 shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeTab === "tokens" && (
                    <div>
                      {isLoading ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                                                     <h3 className="text-white font-medium mb-2 text-sm">Loading tokens...</h3>
                        </div>
                      ) : tokens.length > 0 ? (
                        <div className="space-y-3">
                          {/* Native Token Balance */}
                          <div className="group bg-gradient-to-r from-purple-900/30 to-purple-900/30 rounded-xl p-4 border border-purple-600/30 hover:border-purple-500/50 hover:from-purple-900/50 hover:to-purple-900/50 transition-all duration-300 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  {/* Show Ethereum logo for ETH, BNB logo for BNB, etc. */}
                                  {selectedChain.nativeCurrency.symbol === 'ETH' ? (
                                    <img 
                                      src="/images/chains/1.png" 
                                      alt="Ethereum"
                                      className="w-12 h-12 rounded-full ring-2 ring-purple-600/50 group-hover:ring-purple-500/70 transition-all duration-300 shadow-lg"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                  ) : selectedChain.nativeCurrency.symbol === 'BNB' ? (
                                    <img 
                                      src="/images/chains/56.png" 
                                      alt="BNB"
                                      className="w-12 h-12 rounded-full ring-2 ring-purple-600/50 group-hover:ring-purple-500/70 transition-all duration-300 shadow-lg"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                  ) : selectedChain.nativeCurrency.symbol === 'POL' ? (
                                    <img 
                                      src="/images/chains/137.png" 
                                      alt="Polygon"
                                      className="w-12 h-12 rounded-full ring-2 ring-purple-600/50 group-hover:ring-purple-500/70 transition-all duration-300 shadow-lg"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-teal-500 rounded-full flex items-center justify-center ring-2 ring-purple-600/50 group-hover:ring-purple-500/70 transition-all duration-300 shadow-lg"
                                    style={{ display: selectedChain.nativeCurrency.symbol === 'ETH' || selectedChain.nativeCurrency.symbol === 'BNB' || selectedChain.nativeCurrency.symbol === 'POL' ? 'none' : 'flex' }}
                                  >
                                    <span className="text-white text-lg font-bold">{selectedChain.nativeCurrency.symbol[0]}</span>
                                  </div>
                                  {/* Native token indicator with chain logo */}
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 overflow-hidden">
                                    <img 
                                      src={`/images/chains/${selectedChain.id}.png`}
                                      alt={selectedChain.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to gradient if chain logo fails
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                      }}
                                    />
                                    <div 
                                      className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-500 flex items-center justify-center"
                                      style={{ display: 'none' }}
                                    >
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1">
                                                                     <div className="text-white font-semibold text-base mb-1">{selectedChain.nativeCurrency.name}</div>
                              <div className="flex items-center gap-3">
                                    <span className="text-slate-300 font-medium">{selectedChain.nativeCurrency.symbol}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                                      <span className="text-xs bg-gradient-to-r from-purple-700/50 to-purple-700/50 text-purple-200 px-3 py-1 rounded-full border border-purple-600/30">
                                        {selectedChain.name === 'BNB Smart Chain' ? 'BSC' : 
                                         selectedChain.name === 'Ethereum Mainnet' ? 'Ethereum' :
                                         selectedChain.name === 'Base Mainnet' ? 'Base' :
                                         selectedChain.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                                                   <div className="text-white font-bold text-base mb-1">
                                  {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"}
                                </div>
                                                                 <div className="text-purple-500 font-semibold text-xs">
                                  ${balance ? (parseFloat(balance.formatted) * ethPrice).toFixed(2) : "0.00"}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Multi-Chain Tokens */}
                          {tokens.map((token) => {
                            // Get token logo URL
                            const getTokenLogo = (symbol: string, chainId: number): string => {
                              if (symbol === 'STT' || symbol === 'WSTT' || symbol === 'SOMI') {
                                return `/images/chains/${chainId}.png`
                              }
                              if (symbol === 'USDT') {
                                return '/images/usdt.png'
                              }
                              if (symbol === 'XON') {
                                return '/logo.png'
                              }
                              if (symbol === 'ETH') {
                                return '/images/chains/1.png'
                              }
                              return ''
                            }
                            
                            const logoUrl = getTokenLogo(token.tokenSymbol, token.chainId)
                            
                            return (
                            <div key={`${token.contractAddress}-${token.chainId}`} className="group bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-xl p-4 border border-slate-600/30 hover:border-purple-600/50 hover:from-slate-800/60 hover:to-slate-700/60 transition-all duration-300 backdrop-blur-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    {logoUrl ? (
                                      <img 
                                        src={logoUrl}
                                        alt={token.tokenSymbol}
                                        className="w-12 h-12 rounded-full ring-2 ring-slate-600/50 group-hover:ring-purple-600/50 transition-all duration-300"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const fallback = target.nextElementSibling as HTMLElement
                                          if (fallback) fallback.style.display = 'flex'
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 rounded-full flex items-center justify-center ring-2 ring-slate-600/50 group-hover:ring-purple-600/50 transition-all duration-300 shadow-lg"
                                      style={{ display: logoUrl ? 'none' : 'flex' }}
                                    >
                                      <span className="text-white text-lg font-bold">{token.tokenSymbol.charAt(0)}</span>
                                    </div>
                                    {/* Chain indicator with actual chain logo */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 overflow-hidden">
                                      <img 
                                        src={`/images/chains/${token.chainId}.png`}
                                        alt={token.chainName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to gradient if chain logo fails
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const fallback = target.nextElementSibling as HTMLElement
                                          if (fallback) fallback.style.display = 'flex'
                                        }}
                                      />
                                      <div 
                                        className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-500 flex items-center justify-center"
                                        style={{ display: 'none' }}
                                      >
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                    </div>
                                  </div>
                                                                     <div className="flex-1">
                                     <div className="text-white font-semibold text-base mb-1">
                                       {token.tokenSymbol === 'ETH' ? 'Ethereum' : token.tokenName}
                                     </div>
                                <div className="flex items-center gap-3">
                                      <span className="text-slate-300 font-medium">{token.tokenSymbol}</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                                        <span className="text-xs bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 px-3 py-1 rounded-full border border-slate-600/30">
                                          {token.chainName === 'BNB Smart Chain' ? 'BSC' : 
                                           token.chainName === 'Ethereum Mainnet' ? 'Ethereum' :
                                           token.chainName === 'Base Mainnet' ? 'Base' :
                                           token.chainName}
                                        </span>
                                      </div>
                                  </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-white font-bold text-base mb-1">
                                    {parseFloat(token.balance).toFixed(4)}
                                  </div>
                                                                     <div className="text-purple-500 font-semibold text-xs">
                                    {token.usdValue ? `$${token.usdValue.toFixed(2)}` : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <div className="grid grid-cols-3 gap-1">
                              {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-slate-600 rounded-full" />
                              ))}
                            </div>
                          </div>
                                                     <h3 className="text-white font-medium mb-2 text-sm">No tokens yet</h3>
                                                     <p className="text-slate-400 text-xs mb-4">
                            Buy or transfer tokens to this wallet to get started.
                          </p>
                                                     <Button className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-black font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200">
                            Explore tokens
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                                                 <h3 className="text-purple-500 font-medium flex items-center gap-2 text-sm">
                          <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                          Recent Activity
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-purple-500 hover:bg-slate-800/50 rounded-full transition-all duration-200"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-purple-500 hover:bg-slate-800/50 rounded-full transition-all duration-200"
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchWalletData}
                            disabled={isRefreshing}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-purple-500 hover:bg-slate-800/50 rounded-full transition-all duration-200 disabled:opacity-50"
                          >
                            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {isLoadingTransactions ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <h3 className="text-white font-medium mb-2 text-sm">Loading activity...</h3>
                          <p className="text-slate-400 text-xs">Fetching recent transactions from Somnia...</p>
                        </div>
                      ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                          {/* Show only first 5 transactions initially */}
                          {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((tx) => (
                            <div 
                              key={tx.hash} 
                              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-all duration-200"
                              onClick={() => openTransactionOnBlockExplorer(tx.hash)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    tx.isError === '1' ? 'bg-red-400' : 'bg-purple-500'
                                  }`}></div>
                                                                     <span className="text-white font-medium text-xs">
                                    {formatTransactionType(tx)}
                                  </span>
                                </div>
                                <span className="text-slate-400 text-xs">
                                  {formatTimestamp(tx.timeStamp)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-slate-300 text-xs font-mono">
                                  {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                                </div>
                                <div className="text-right">
                                  <div className="text-white text-sm">
                                    {tx.value === '0' ? `0 ${selectedChain.nativeCurrency.symbol}` : `${(parseFloat(tx.value) / 1e18).toFixed(6)} ${selectedChain.nativeCurrency.symbol}`}
                                  </div>
                                  <div className="text-slate-400 text-xs">
                                    Gas: {parseInt(tx.gasUsed).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Show more/less button if there are more than 5 transactions */}
                          {transactions.length > 5 && (
                            <div className="pt-2">
                              <Button
                                variant="ghost"
                                onClick={() => setShowAllTransactions(!showAllTransactions)}
                                className="w-full text-purple-500 hover:text-purple-600 hover:bg-purple-600/20 border border-purple-600/30 rounded-lg transition-all duration-200"
                              >
                                {showAllTransactions ? 'Show less' : `See more (${transactions.length - 5} more)`}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <div className="w-6 h-6 text-slate-600">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            </div>
                          </div>
                                                     <h3 className="text-white font-medium mb-2 text-sm">No activity yet</h3>
                                                     <p className="text-slate-400 text-xs">Your transaction history will appear here.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
