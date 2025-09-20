"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { NetworkMatrix } from "@/components/network-matrix"
import { XontraPromptEngine } from "@/components/xontra-prompt-engine"
import { WalletDrawer } from "@/components/wallet-drawer"
import { Footer } from "@/components/footer"
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains"

export default function SwapPage() {
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(SUPPORTED_CHAINS[0])
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false)

  const handleChainChange = (chain: ChainConfig) => {
    setSelectedChain(chain)
  }

  const handleWalletClick = () => {
    setIsWalletDrawerOpen(true)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black text-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Flowing wave paths */}
          <path
            d="M0,200 Q300,100 600,200 T1200,200 Q900,300 600,200 T0,200"
            fill="none"
            stroke="url(#wave1)"
            strokeWidth="2"
            className="animate-pulse"
          />
          <path
            d="M0,350 Q400,250 800,350 T1200,350 Q800,450 400,350 T0,350"
            fill="none"
            stroke="url(#wave2)"
            strokeWidth="2"
            className="animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
          <path
            d="M0,500 Q200,400 400,500 T800,500 Q1000,600 1200,500"
            fill="none"
            stroke="url(#wave3)"
            strokeWidth="2"
            className="animate-pulse"
            style={{ animationDelay: "3s" }}
          />

          {/* Additional flowing curves */}
          <path
            d="M0,150 Q600,50 1200,150 Q600,250 0,150"
            fill="none"
            stroke="url(#wave1)"
            strokeWidth="1"
            opacity="0.6"
            className="animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
          <path
            d="M0,600 Q300,500 600,600 T1200,600 Q900,700 600,600 T0,600"
            fill="none"
            stroke="url(#wave2)"
            strokeWidth="1"
            opacity="0.5"
            className="animate-pulse"
            style={{ animationDelay: "2.5s" }}
          />
        </svg>

        {/* Animated gradient overlays */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"></div>
          <div
            className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen min-h-[100dvh] mobile-safe-area">
        <Navigation 
          onWalletClick={() => setIsWalletDrawerOpen(true)} 
          onChainChange={setSelectedChain}
        />

        <div className="flex-1 flex gap-6 p-3 sm:p-6">
          {/* Main Content - Now Centered */}
          <div className="flex-1 max-w-4xl mx-auto space-y-6 flex flex-col w-full">
            <div className="flex-1 min-h-[400px] sm:min-h-[500px]">
              <XontraPromptEngine selectedChain={selectedChain} title="XONTRA SWAP ENGINE" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <NetworkMatrix selectedChain={selectedChain} />
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <WalletDrawer 
        isOpen={isWalletDrawerOpen} 
        onClose={() => setIsWalletDrawerOpen(false)} 
        selectedChain={selectedChain}
      />
    </div>
  )
}
