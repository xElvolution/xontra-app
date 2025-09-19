"use client"

import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains"
import { useAccount, useChainId } from 'wagmi'
import { ethers } from 'ethers'
import { getSwapQuote } from '@/lib/somniaswap'

export function NetworkMatrix({ selectedChain }: { selectedChain: ChainConfig }) {
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useAccount()
  const chainId = useChainId()
  
  const currentChain = chainId ? SUPPORTED_CHAINS.find(c => c.id === chainId) : selectedChain
  const [networkMetrics, setNetworkMetrics] = useState([
    {
      name: "Gas Oracle",
      value: "Loading...",
      bgColor: "bg-purple-600/20",
      tooltip: "Fetching Somnia gas prices...",
      icon: (
        <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3h1c.55 0 1 .45 1 1v3.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77z" />
        </svg>
      ),
    },
    {
      name: "Token Price",
      value: "Loading...",
      bgColor: "bg-purple-600/20",
      tooltip: "Fetching SOMI price...",
      icon: (
        <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
    {
      name: "Network Load",
      value: "Loading...",
      bgColor: "bg-purple-600/20",
      tooltip: "Analyzing Somnia network...",
      icon: (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
      ),
    },
    {
      name: "Chain ID",
      value: "5031",
      bgColor: "bg-purple-600/20",
      tooltip: "Somnia Mainnet",
      icon: (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ])

  useEffect(() => {
    const fetchNetworkData = async () => {
      setIsLoading(true)
      try {
        // Update Chain ID based on wallet's actual chain
        const displayChainId = isConnected ? chainId : selectedChain.id
        const displayChain = SUPPORTED_CHAINS.find(c => c.id === displayChainId) || selectedChain
        
        setNetworkMetrics(prev => prev.map(metric => {
          if (metric.name === "Chain ID") {
            return {
              ...metric,
              value: displayChainId.toString(),
              tooltip: displayChain.name
            }
          }
          return metric
        }))

        // Fetch Somnia chain data
        const actualChainId = isConnected ? chainId : selectedChain.id
        
        if (actualChainId === 5031) {
          // Somnia Mainnet
          await fetchSomniaMainnetData()
        } else if (actualChainId === 50312) {
          // Somnia Testnet
          await fetchSomniaTestnetData()
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching network data:', error)
        setNetworkMetrics(prev => prev.map(metric => {
          if (metric.name === "Gas Oracle") {
            return { ...metric, value: "Error", tooltip: "Failed to fetch gas prices" }
          }
          if (metric.name === "Token Price") {
            return { ...metric, value: "Error", tooltip: "Failed to fetch token price" }
          }
          if (metric.name === "Network Load") {
            return { ...metric, value: "Error", tooltip: "Failed to analyze network" }
          }
          return metric
        }))
        setIsLoading(false)
      }
    }

    const fetchSomniaMainnetData = async () => {
      try {
        // Fetch SOMI price from CoinGecko
        const somiPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=somnia&vs_currencies=usd')
        const somiPriceData = await somiPriceResponse.json()
        const somiPrice = somiPriceData.somnia?.usd || 0.01

        // Simulate Somnia gas prices (since it's a new chain)
        const gasPrice = '0.001' // Very low gas on Somnia

        // Simulate network load for Somnia
        const networkLoad = Math.floor(Math.random() * 20) + 30 // 30-50% (newer chain)

        setNetworkMetrics(prev => prev.map(metric => {
          if (metric.name === "Token Price") {
            return {
              ...metric,
              value: `$${somiPrice.toFixed(4)}`,
              tooltip: `SOMI price: $${somiPrice.toFixed(4)}`
            }
          }
          if (metric.name === "Gas Oracle") {
            return {
              ...metric,
              value: `${gasPrice} SOMI`,
              tooltip: `Gas price: ${gasPrice} SOMI`
            }
          }
          if (metric.name === "Network Load") {
            return {
              ...metric,
              value: `${networkLoad}%`,
              tooltip: `Somnia network utilization: ${networkLoad}%`
            }
          }
          if (metric.name === "Chain ID") {
            return {
              ...metric,
              value: "5031",
              tooltip: "Somnia Mainnet"
            }
          }
          return metric
        }))
      } catch (error) {
        console.error('Error fetching Somnia Mainnet data:', error)
      }
    }

    const fetchSomniaTestnetData = async () => {
      try {
        // Use the same getSwapQuote function that works for swaps
        console.log('Fetching STT price using getSwapQuote...')
        const quote = await getSwapQuote('stt', 'usdt', '1', 50312)
        console.log('Quote response:', quote)
        const sttPrice = parseFloat(quote.toAmount)
        console.log('STT price from quote:', sttPrice)

        // Very low gas on testnet
        const gasPrice = '0.0001'

        // Lower network load on testnet
        const networkLoad = Math.floor(Math.random() * 15) + 20 // 20-35%

        setNetworkMetrics(prev => prev.map(metric => {
          if (metric.name === "Token Price") {
            return {
              ...metric,
              value: `$${sttPrice.toFixed(4)}`,
              tooltip: `STT price: $${sttPrice.toFixed(4)} (from Somnia Exchange)`
            }
          }
          if (metric.name === "Gas Oracle") {
            return {
              ...metric,
              value: `${gasPrice} STT`,
              tooltip: `Gas price: ${gasPrice} STT`
            }
          }
          if (metric.name === "Network Load") {
            return {
              ...metric,
              value: `${networkLoad}%`,
              tooltip: `Somnia Testnet utilization: ${networkLoad}%`
            }
          }
          if (metric.name === "Chain ID") {
            return {
              ...metric,
              value: "50312",
              tooltip: "Somnia Testnet"
            }
          }
          return metric
        }))
      } catch (error) {
        console.error('Error fetching Somnia Testnet data:', error)
        // Don't update metrics if router call fails - keep showing loading
      }
    }

    fetchNetworkData()
    
    // Update every 30 seconds for real-time data
    const interval = setInterval(fetchNetworkData, 30000)
    
    return () => clearInterval(interval)
  }, [isConnected, chainId, selectedChain])

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 flex items-center justify-center">
          <img 
            src={selectedChain.imageUrl} 
            alt={selectedChain.name}
            className="w-7 h-7"
            onError={(e) => {
              console.error('Failed to load image:', selectedChain.imageUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <h2 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-purple-500 bg-clip-text text-transparent flex items-center">
            {currentChain?.name || selectedChain.name}
            {isLoading && (
              <span className="ml-2 inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            )}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {networkMetrics.map((metric) => (
          <Card
            key={metric.name} 
            className={`${metric.bgColor} border-slate-700 p-3 hover:border-slate-600 transition-all duration-200 hover:scale-105 cursor-pointer group relative`}
            title={metric.tooltip}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="text-sm text-slate-300 font-medium">{metric.name}</span>
              </div>
              <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                {metric.value}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}