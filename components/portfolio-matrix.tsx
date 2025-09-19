import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, MoreHorizontal, Eye, Plus } from "lucide-react"

export function PortfolioMatrix() {
  const portfolioData = {
    totalValue: "$9,837.52",
    profit: "+24.7% PROFIT",
    dailyChange: "+$1,247.83",
    tokens: [
      {
        symbol: "ETH",
        name: "Ethereum",
        amount: "3.245",
        value: "$7,234.56",
        percentage: "68% of portfolio",
        change: "+12.3%",
        color: "bg-blue-500",
        price: "$2,230.45",
        volume: "$2.1B",
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        amount: "512.85",
        value: "$512.85",
        percentage: "15% of portfolio",
        change: "+0.1%",
        color: "bg-blue-400",
        price: "$1.00",
        volume: "$890M",
      },
      {
        symbol: "WBTC",
        name: "Wrapped Bitcoin",
        amount: "0.0123",
        value: "$842.31",
        percentage: "12% of portfolio",
        change: "+8.7%",
        color: "bg-orange-500",
        price: "$68,500.00",
        volume: "$1.5B",
      },
      {
        symbol: "AAVE",
        name: "Aave",
        amount: "15.5",
        value: "$1,247.80",
        percentage: "5% of portfolio",
        change: "+15.2%",
        color: "bg-pink-500",
        price: "$80.50",
        volume: "$125M",
      },
    ],
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Header */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-slate-900" />
            </div>
            <h2 className="text-lg font-bold text-white">PORTFOLIO</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Eye className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
            <div className="px-3 py-1 bg-teal-500/20 rounded-full border border-teal-500/30">
              <span className="text-teal-300 text-xs font-medium">{portfolioData.profit}</span>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <div className="text-2xl font-bold text-white">{portfolioData.totalValue}</div>
          <div className="text-teal-400 text-sm font-medium">{portfolioData.dailyChange}</div>
        </div>
        <div className="text-slate-400 text-xs">Total Portfolio Value • 24h Change</div>
      </Card>

      {/* Token Holdings Grid */}
      <div className="grid grid-cols-2 gap-3">
        {portfolioData.tokens.map((token) => (
          <Card
            key={token.symbol}
            className="bg-slate-900/50 border-slate-800 p-3 hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${token.color} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">{token.symbol.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{token.symbol}</h3>
                  <p className="text-slate-400 text-xs">{token.price}</p>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition-all">
                <MoreHorizontal className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{token.amount}</div>
                <div className="text-slate-400 text-xs">{token.value}</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{token.percentage}</span>
                <div className="flex items-center gap-1">
                  {token.change.startsWith("+") ? (
                    <TrendingUp className="w-3 h-3 text-teal-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`font-medium ${token.change.startsWith("+") ? "text-teal-400" : "text-red-400"}`}>
                    {token.change}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
