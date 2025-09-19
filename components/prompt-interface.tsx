"use client"

import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"

export function PromptInterface() {
  const [syncRate, setSyncRate] = useState(99.7)
  const [latency, setLatency] = useState(2)

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncRate((prev) => Math.max(98.5, Math.min(99.9, prev + (Math.random() - 0.5) * 0.2)))
      setLatency((prev) => Math.max(1, Math.min(5, prev + (Math.random() - 0.5) * 0.5)))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const metrics = [
    {
      name: "Sync Rate",
      value: `${syncRate.toFixed(1)}%`,
      status: syncRate > 99 ? "OPTIMAL" : syncRate > 98 ? "GOOD" : "DEGRADED",
      color: syncRate > 99 ? "text-teal-400" : syncRate > 98 ? "text-yellow-400" : "text-red-400",
      bgColor: syncRate > 99 ? "bg-teal-500/20" : syncRate > 98 ? "bg-yellow-500/20" : "bg-red-500/20",
      borderColor: syncRate > 99 ? "border-teal-500/30" : syncRate > 98 ? "border-yellow-500/30" : "border-red-500/30",
      icon: "⚡",
      description: "AI pathway synchronization",
    },
    {
      name: "Security",
      value: "MAX",
      status: "SECURE",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
      icon: "🛡",
      description: "Cryptographic integrity",
    },
    {
      name: "Latency",
      value: `${latency.toFixed(0)}ms`,
      status: latency < 3 ? "EXCELLENT" : latency < 5 ? "GOOD" : "HIGH",
      color: latency < 3 ? "text-teal-400" : latency < 5 ? "text-yellow-400" : "text-red-400",
      bgColor: latency < 3 ? "bg-teal-500/20" : latency < 5 ? "bg-yellow-500/20" : "bg-red-500/20",
      borderColor: latency < 3 ? "border-teal-500/30" : latency < 5 ? "border-yellow-500/30" : "border-red-500/30",
      icon: "⚡",
      description: "Response time optimization",
    },
    {
      name: "Bandwidth",
      value: "1.2 GB/s",
      status: "STABLE",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      icon: "📡",
      description: "Data throughput capacity",
    },
  ]

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-white font-semibold">Prompt Interface</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className={`p-4 bg-slate-800/50 rounded-lg border ${metric.borderColor} hover:bg-slate-800/70 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${metric.bgColor} rounded-lg flex items-center justify-center border ${metric.borderColor}`}
                >
                  <span className="text-sm">{metric.icon}</span>
                </div>
                <div>
                  <span className="text-slate-300 text-sm font-medium">{metric.name}</span>
                  <div className="text-xs text-slate-500">{metric.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${metric.color}`}>{metric.value}</div>
                <div className={`text-xs font-medium ${metric.color}`}>{metric.status}</div>
              </div>
            </div>

            {metric.name === "Sync Rate" && (
              <div className="mt-3">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-purple-400 transition-all duration-1000"
                    style={{ width: `${syncRate}%` }}
                  ></div>
                </div>
              </div>
            )}

            {metric.name === "Bandwidth" && (
              <div className="mt-3">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-400 w-3/4 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
