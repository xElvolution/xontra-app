'use client'

import { LiFiWidget, WidgetConfig } from '@lifi/widget'
import { useMemo } from 'react'

interface LiFiWidgetProps {
  fromChain?: string
  toChain?: string
  fromAmount?: string
  fromToken?: string
  toToken?: string
}

export default function LiFiWidgetComponent({
  fromChain,
  toChain,
  fromAmount,
  fromToken,
  toToken
}: LiFiWidgetProps) {
  const widgetConfig: WidgetConfig = useMemo(() => ({
    integrator: 'xontra-dex',
    // Following LiFi documentation: Select Widget Variants
    variant: 'default', // Use default variant for full interface
    subvariant: 'default', // Use default subvariant
    // Initialize form values as per LiFi documentation - CORRECT PROPERTY NAMES
    fromChain: fromChain ? parseInt(fromChain) : undefined,
    toChain: toChain ? parseInt(toChain) : undefined,
    fromToken: fromToken,
    toToken: toToken,
    fromAmount: fromAmount,
    // Theme configuration following LiFi docs
    theme: {
      appearance: 'dark',
      container: {
        borderRadius: '12px',
        border: '1px solid rgb(64, 64, 64)',
        height: '100%',
        width: '100%',
        overflow: 'hidden', // Prevent overflow
      },
    },
    // Let LiFi handle all chains naturally - no restrictions
    // chains: {}, // Remove chain restrictions to show ALL available chains
    
    // Add comprehensive token lists for maximum token coverage
    tokenLists: [
      'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
      'https://tokens.coingecko.com/uniswap/all.json',
      'https://raw.githubusercontent.com/lifinance/tokenlists/main/lifi.tokenlist.json'
    ],
    // Add SDK configuration for better chain handling
    sdkConfig: {
      rpcUrls: {
        1: ['https://eth.llamarpc.com'], // Ethereum
        56: ['https://bsc.llamarpc.com'], // BSC
        137: ['https://polygon.llamarpc.com'], // Polygon
        42161: ['https://arbitrum.llamarpc.com'], // Arbitrum
        10: ['https://optimism.llamarpc.com'], // Optimism
        8453: ['https://base.llamarpc.com'], // Base
      },
    },
    // Configure bridges for optimal routing
    bridges: {
      allow: ['stargate', 'hop', 'across', 'anyswap'],
    },
    // Add route configuration
    routePriority: {
      maxPriceImpact: 0.5, // Max 50% price impact
    },
  }), [fromChain, toChain, fromAmount, fromToken, toToken])

  return (
    <div className="w-full h-[600px] overflow-hidden">
      <LiFiWidget
        integrator="xontra-dex"
        config={widgetConfig}
      />
    </div>
  )
}