"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X, ChevronLeft, ChevronRight, Home, Zap, Brain, Image, Search, Settings, Moon, LogOut, User, Building, DollarSign, ShoppingCart, ShoppingBag, FileSearch, Users, Tag } from "lucide-react"
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
    // Only add event listener if any dropdown is open
    if (!isChainDropdownOpen && !isExploreDropdownOpen && !isNFTDropdownOpen) {
      return
    }

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
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-black/90 backdrop-blur-sm border-r border-slate-800/50 transition-all duration-300 z-50 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } hidden md:block`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Xontra Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to gradient if logo fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                      parent.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl flex items-center justify-center"><span class="text-white font-bold text-sm">X</span></div>';
                }
              }}
            />
          </div>
              <span className="text-white text-xl font-bold bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
            Xontra
          </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-slate-800/50 rounded-md transition-colors text-slate-300 hover:text-white"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-6">
          {/* DeFi Section */}
          <div>
            <h3 className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}>
              DeFi
            </h3>
            {isSidebarCollapsed && (
              <div className="mb-2 flex justify-center">
                <span className="text-[10px] font-semibold text-slate-400">D</span>
              </div>
            )}
            <div className="space-y-1">
              <Link 
                href="/" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                  pathname === "/" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Home className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Dashboard</span>}
              </Link>
          <Link 
            href="/swap" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
              pathname === "/swap" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
                <Zap className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Swap</span>}
          </Link>
              <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800/50 w-full`}>
                <DollarSign className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && (
                  <span className="flex items-center gap-2">
                    Yield
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Soon</span>
                  </span>
                )}
              </button>
              
            </div>
          </div>

          {/* NFT Section */}
          <div>
            <h3 className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}>
              NFT
            </h3>
            {isSidebarCollapsed && (
              <div className="mb-2 flex justify-center">
                <span className="text-[10px] font-semibold text-slate-400">N</span>
              </div>
            )}
            <div className="space-y-1">
                <Link 
                  href="/nft" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                  pathname === "/nft" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Image className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Overview</span>}
                </Link>
                <Link 
                  href="/nft/founders" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                  pathname === "/nft/founders" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Users className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Founders NFT</span>}
                </Link>
                <Link 
                  href="/nft/agents" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                  pathname === "/nft/agents" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Brain className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>AI Agents</span>}
                </Link>
              </div>
          </div>
          
          {/* TOOLS Section */}
          <div>
            <h3 className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}>
              Tools
            </h3>
            {isSidebarCollapsed && (
              <div className="mb-2 flex justify-center">
                <span className="text-[10px] font-semibold text-slate-400">T</span>
              </div>
            )}
            <div className="space-y-1">
              <Link 
                href="/deploy" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                  pathname === "/deploy" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Zap className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Deploy</span>}
              </Link>
              <Link 
                href="/faucet" 
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors ${
                  pathname === "/faucet" 
                    ? "bg-purple-600/20 text-white border border-purple-500/30" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <DollarSign className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Faucet</span>}
              </Link>
              <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800/50 w-full cursor-not-allowed opacity-50`}>
                <Brain className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && (
                  <span className="flex items-center gap-2">
                    Agent Hub
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Soon</span>
                  </span>
                )}
              </button>
              <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800/50 w-full`}>
                <Search className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && (
                  <span className="flex items-center gap-2">
              Explore
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Soon</span>
                  </span>
                )}
            </button>
            </div>
          </div>

          {/* SYSTEM Section */}
          <div>
            <h3 className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}>
              System
            </h3>
            {isSidebarCollapsed && (
              <div className="mb-2 flex justify-center">
                <span className="text-[10px] font-semibold text-slate-400">S</span>
              </div>
            )}
            <div className="space-y-1">
              <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800/50 w-full`}>
                <Settings className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Settings</span>}
                </button>
              <button className={`flex items-center ${isSidebarCollapsed ? 'justify-center gap-0 px-0 py-2' : 'gap-3 px-3 py-2'} rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800/50 w-full`}>
                <Moon className={isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5"} />
                {!isSidebarCollapsed && <span>Dark mode</span>}
                </button>
              </div>
          </div>
        </nav>

      </div>

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-sm border-b border-slate-800/50 z-40 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Xontra Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to gradient if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl flex items-center justify-center"><span class="text-white font-bold text-sm">X</span></div>';
                  }
                }}
              />
            </div>
            <span className="text-white text-xl font-bold bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
              Xontra
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50 p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Desktop Top Bar */}
      <div className={`fixed top-0 right-0 h-16 bg-black/80 backdrop-blur-sm border-b border-slate-800/50 transition-all duration-300 z-40 ${
        isSidebarCollapsed ? 'left-16' : 'left-64'
      } hidden md:block`}>
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              {pathname === "/" && "Dashboard"}
              {pathname === "/swap" && "Swap"}
              {pathname === "/deploy" && "Deploy"}
              {pathname === "/faucet" && "Faucet"}
              {pathname === "/nft" && "NFT Marketplace"}
              {pathname === "/nft/founders" && "Founders NFT"}
              {pathname === "/nft/agents" && "AI Agents"}
            </h1>
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
                  className="w-5 h-5 rounded"
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
                <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-[9999] min-w-[140px]">
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
                        className="w-5 h-5"
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

            {/* Wallet Connection */}
          {isConnected ? (
          <Button
            onClick={handleWalletClick}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
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
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
                    Connect Wallet
          </Button>
                )
              }}
            </ConnectButton.Custom>
          )}
        </div>
        </div>
      </div>

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
                <Link href="/swap" className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  Swap
                </Link>
                <Link href="/deploy" className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  Deploy
                </Link>
                <Link href="/faucet" className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  Faucet
                </Link>
                <button className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors cursor-not-allowed opacity-50" disabled>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span>Agent Hub</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Soon</span>
                </button>
                
                {/* NFT Section with Dropdown */}
                <div className="space-y-1 nft-dropdown">
                  <button 
                    onClick={() => setIsNFTDropdownOpen(!isNFTDropdownOpen)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                    <span>NFT</span>
                    <svg className={`w-4 h-4 ml-auto transition-transform ${isNFTDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isNFTDropdownOpen && (
                    <div className="ml-6 space-y-1">
                      <Link 
                        href="/nft" 
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors" 
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsNFTDropdownOpen(false)
                        }}
                      >
                        <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        Overview
                      </Link>
                      <Link 
                        href="/nft/founders" 
                        className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors" 
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsNFTDropdownOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span>Founders NFT</span>
                        </div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                      </Link>
                      <Link 
                        href="/nft/agents" 
                        className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors" 
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsNFTDropdownOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span>AI Agents</span>
                        </div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                </Link>
                    </div>
                  )}
                </div>
                
                {/* Explore Section with Dropdown */}
                <div className="space-y-1 explore-dropdown">
                  <button 
                    onClick={() => setIsExploreDropdownOpen(!isExploreDropdownOpen)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span>Explore</span>
                    <svg className={`w-4 h-4 ml-auto transition-transform ${isExploreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                  
                  {isExploreDropdownOpen && (
                    <div className="ml-6 space-y-1">
                      <button className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span>Tokens</span>
                        </div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                      </button>
                      <button className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-600 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span>Pool</span>
                        </div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                      </button>
                    </div>
                  )}
                </div>

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
