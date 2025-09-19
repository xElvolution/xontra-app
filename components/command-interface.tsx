"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function CommandInterface() {
  const [command, setCommand] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [commandHistory, setCommandHistory] = useState([
    { command: "scan wallet.balance", result: "3.245 ETH | $7,234.56 USD", timestamp: "2m ago" },
    { command: "analyze gas.matrix", result: "Optimal: 15 gwei | Est. $12.45", timestamp: "5m ago" },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    setIsProcessing(true)

    // Simulate command processing
    setTimeout(() => {
      const newEntry = {
        command: command,
        result: "Command executed successfully",
        timestamp: "now",
      }
      setCommandHistory([newEntry, ...commandHistory.slice(0, 4)])
      setCommand("")
      setIsProcessing(false)
    }, 1500)
  }

  const quickCommands = [
    { label: "scan wallet.balance", description: "Check current balances" },
    { label: "analyze gas.matrix", description: "Gas price optimization" },
    { label: "compute portfolio.value", description: "Portfolio analysis" },
    { label: "bridge tokens.cross_chain", description: "Cross-chain operations" },
  ]

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Neural Command Interface</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          <span className="text-teal-300 text-sm font-medium">READY</span>
        </div>
      </div>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 focus-within:border-teal-500/50 transition-colors">
          <div className="text-teal-400 font-mono text-sm">{">"}</div>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter neural command or query..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none font-mono"
            disabled={isProcessing}
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !command.trim()}
              className="bg-teal-500 hover:bg-teal-600 text-slate-900 h-8 w-8 p-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Quick Commands */}
      <div className="mb-6">
        <h3 className="text-slate-400 text-sm mb-3">Quick Commands</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickCommands.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => setCommand(cmd.label)}
              className="flex items-center gap-2 p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-teal-500/30 transition-all text-left group"
            >
              <span className="text-teal-400 group-hover:text-teal-300">{">"}</span>
              <div>
                <div className="text-slate-300 text-sm font-mono">{cmd.label}</div>
                <div className="text-slate-500 text-xs">{cmd.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Command History */}
      <div>
        <h3 className="text-slate-400 text-sm mb-3">Command History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {commandHistory.map((entry, index) => (
            <div key={index} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-teal-400 text-sm">{">"}</span>
                <span className="text-slate-300 text-sm font-mono">{entry.command}</span>
                <span className="text-slate-500 text-xs ml-auto">{entry.timestamp}</span>
              </div>
              <div className="text-slate-400 text-sm pl-4 border-l-2 border-slate-700">{entry.result}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-6 flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>ENTER to execute</span>
          <span>SHIFT + ENTER for multiline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          <span className="text-teal-300 text-xs font-medium">Neural protocols active</span>
        </div>
      </div>
    </Card>
  )
}
