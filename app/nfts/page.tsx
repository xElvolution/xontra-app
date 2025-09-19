"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { WalletDrawer } from "@/components/wallet-drawer"
import { Footer } from "@/components/footer"
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NFTsOverviewPage() {
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
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
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
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"></div>
          <div
            className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen min-h-[100dvh] mobile-safe-area">
        <Navigation onWalletClick={handleWalletClick} onChainChange={handleChainChange} />

        {/* Main Hero Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            {/* Main Content */}
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-400 to-purple-400">
                  Embrace the Celestial
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-400 to-purple-400">
                  Realm, Ignite DeFi
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                Unlock the Power of the Zodiac: Participate in our Celestial Voyage to Fuel the DeFi Revolution!
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/nfts/founders">
                <Button 
                  size="lg" 
                  className="w-full sm:w-48 bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-black px-8 py-6 text-xl font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  Founders NFT
                </Button>
              </Link>
              
              <Link href="/nfts/agents">
                <Button 
                  size="lg" 
                  className="w-full sm:w-48 bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-black px-8 py-6 text-xl font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  AI Agents
                </Button>
              </Link>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20 max-w-4xl mx-auto">
              <div className="space-y-6 text-center">
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-400">
                  Founders NFT
                </h3>
                <p className="text-slate-400 text-xl leading-relaxed">
                  Exclusive access to premium features and early benefits in the Xontra ecosystem
                </p>
              </div>
              
              <div className="space-y-6 text-center">
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-400">
                  AI Agents
                </h3>
                <p className="text-slate-400 text-xl leading-relaxed">
                  Advanced AI companions with unique capabilities and enhanced DeFi interactions
                </p>
              </div>
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


