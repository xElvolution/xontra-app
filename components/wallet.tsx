"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'

export function Wallet() {
  const { isConnected, address } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })

  if (!isConnected) {
    return (
      <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-sm p-6 h-[700px] max-h-[700px] flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30 flex-shrink-0">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 bg-clip-text text-transparent">
            XONTRA PROMPT ENGINE
          </h2>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-slate-400 text-sm mb-4">
              Connect your wallet to start using XONTRA
            </p>
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
                    className="bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Connect Wallet
                  </Button>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-sm p-6 h-[700px] max-h-[700px] flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30 flex-shrink-0">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 bg-clip-text text-transparent">
          XONTRA PROMPT ENGINE
        </h2>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Wallet Connected!</h3>
          <p className="text-slate-400 text-sm mb-4">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <div className="bg-slate-800/30 rounded-lg p-4 mb-4 border border-slate-700/30">
            <div className="text-2xl font-bold text-white mb-2">
              {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"} {balance?.symbol}
            </div>
            <div className="text-slate-400 text-sm">
              ${balance ? (parseFloat(balance.formatted) * 2800).toFixed(2) : "0.00"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
