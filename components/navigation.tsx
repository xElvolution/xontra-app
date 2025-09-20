"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation({ onWalletClick, onChainChange }: { onWalletClick: () => void, onChainChange: (chain: ChainConfig) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false)
  const [isExploreDropdownOpen, setIsExploreDropdownOpen] = useState(false)
  const [isNFTDropdownOpen, setIsNFTDropdownOpen] = useState(false)

  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const pathname = usePathname()
  
  const currentChain = chainId ? SUPPORTED_CHAINS.find(c => c.id === chainId) : SUPPORTED_CHAINS[0]

  useEffect(() => {
    if (currentChain) {
      onChainChange(currentChain)
    }
  }, [currentChain, onChainChange])

  const handleChainChange = async (chain: ChainConfig) => {
    if (!isConnected) {
      onChainChange(chain)
      return
    }

    try {
      if (switchChain) {
        await switchChain({ chainId: chain.id })
      }
    } catch (error: any) {
      console.error('Failed to switch chain:', error)
    }
  }

  const handleWalletClick = () => {
    if (isConnected) {
      onWalletClick()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isChainDropdownOpen && !target.closest('.chain-dropdown')) {
        setIsChainDropdownOpen(false)
      }
      if (isExploreDropdownOpen && !target.closest('.explore-dropdown')) {
        setIsExploreDropdownOpen(false)
      }
      if (isNFTDropdownOpen && !target.closest('.nft-dropdown')) {
        setIsNFTDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isChainDropdownOpen, isExploreDropdownOpen, isNFTDropdownOpen])

  return (
    <>
      <nav className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-black/80 backdrop-blur-sm border-b border-slate-800/50 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Xontra Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to gradient if logo fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl flex items-center justify-center"><span class="text-black font-bold text-lg">X</span></div>';
                }
              }}
            />
          </div>
          <span className="hidden md:block text-white text-xl font-bold bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
            Xontra
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          <Link 
            href="/swap" 
            className={`transition-colors font-medium ${
              pathname === "/swap" 
                ? "text-white bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent" 
                : "text-slate-300 hover:text-white"
            }`}
          >
            Swap
          </Link>
          {/* NFT Dropdown */}
          <div className="relative nft-dropdown">
            <button
              onClick={() => setIsNFTDropdownOpen(!isNFTDropdownOpen)}
              className={`transition-colors font-medium flex items-center gap-1 ${
                pathname.startsWith("/nfts") || pathname === "/nft"
                  ? "text-white bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              NFT
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isNFTDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-[9999] min-w-[180px]">
                <Link 
                  href="/nfts" 
                  className="w-full flex items-center px-4 py-2 text-white hover:bg-slate-700/50 transition-colors first:rounded-t-lg"
                  onClick={() => setIsNFTDropdownOpen(false)}
                >
                  Overview
                </Link>
                <Link 
                  href="/nfts/founders" 
                  className="w-full flex items-center justify-between px-4 py-2 text-white hover:bg-slate-700/50 transition-colors"
                  onClick={() => setIsNFTDropdownOpen(false)}
                >
                  <span>Founders NFT</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                </Link>
                <Link 
                  href="/nfts/agents" 
                  className="w-full flex items-center justify-between px-4 py-2 text-white hover:bg-slate-700/50 transition-colors last:rounded-b-lg"
                  onClick={() => setIsNFTDropdownOpen(false)}
                >
                  <span>AI Agents</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                </Link>
              </div>
            )}
          </div>
          
          
          {/* Explore Dropdown */}
          <div className="relative explore-dropdown">
            <button
              onClick={() => setIsExploreDropdownOpen(!isExploreDropdownOpen)}
              className="text-slate-300 hover:text-white transition-colors font-medium flex items-center gap-1"
            >
              Explore
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isExploreDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-[9999] min-w-[120px]">
                <button className="w-full flex items-center justify-between px-4 py-2 text-white hover:bg-slate-700/50 transition-colors first:rounded-t-lg">
                  <span>Tokens</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                </button>
                <button className="w-full flex items-center justify-between px-4 py-2 text-white hover:bg-slate-700/50 transition-colors last:rounded-b-lg">
                  <span>Pool</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Network Selector */}
          <div className="relative chain-dropdown">
            <button
              onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
              disabled={isSwitching}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm hover:border-slate-600/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <img 
                src={currentChain?.imageUrl} 
                alt={currentChain?.name}
                className="w-6 h-6 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {isSwitching ? "🔄 Switching..." : currentChain?.shortName || "ETH"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isChainDropdownOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-[9999] min-w-[140px]">
                {SUPPORTED_CHAINS.map(chain => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      handleChainChange(chain);
                      setIsChainDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <img 
                      src={chain.imageUrl} 
                      alt={chain.name}
                      className="w-6 h-6"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {chain.shortName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800/50 p-1 sm:p-2"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          {isConnected ? (
          <Button
            onClick={handleWalletClick}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-black font-medium px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm"
            >
              {address?.slice(0,6)}...{address?.slice(-4)}
            </Button>
          ) : (
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <Button
                    onClick={openConnectModal}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-black font-medium px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm"
          >
                    Connect Wallet
          </Button>
                )
              }}
            </ConnectButton.Custom>
          )}
        </div>
      </nav>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 z-50 animate-in slide-in-from-bottom duration-300 md:hidden">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Menu</h3>
                <Button
                  variant="ghost"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-1">
                <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  Swap
                </Link>
                <Link href="/nft" className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  NFT
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span>Explore</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50 ml-auto"></div>
                </button>

                <div className="border-t border-slate-700/50 pt-4 mt-4">
                  <button
                    onClick={() => {
                      handleWalletClick()
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-black text-xs font-bold">W</span>
                    </div>
                    {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
