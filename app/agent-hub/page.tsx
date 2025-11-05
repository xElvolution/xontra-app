"use client"

import { Navigation } from "@/components/navigation"
import { WalletDrawer } from "@/components/wallet-drawer"
import { Footer } from "@/components/footer"
import { useState, useEffect } from "react"
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AgentHubPage() {
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(SUPPORTED_CHAINS[0])
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  const handleChainChange = (chain: ChainConfig) => {
    setSelectedChain(chain)
  }

  const handleWalletClick = () => {
    setIsWalletDrawerOpen(true)
  }

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
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 bg-slate-800/50 border-slate-700 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Agent Hub</h1>
                  <p className="text-slate-300 mb-1">This feature is currently unavailable</p>
                  <p className="text-sm text-slate-400">Coming soon...</p>
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Return to Dashboard
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Redirecting automatically in a few seconds...
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
