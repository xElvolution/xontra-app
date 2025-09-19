import { Activity, Search, Filter, RefreshCw } from "lucide-react"

export function RecentActivity() {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 backdrop-blur-sm rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-400 bg-clip-text text-transparent">
            Recent Activity
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
            <Filter className="w-4 h-4 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <div className="w-6 h-6 text-slate-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h3 className="text-white font-semibold mb-2">No activity yet</h3>
        <p className="text-slate-400 text-sm">Your transaction history will appear here when you start trading.</p>
      </div>
    </div>
  )
}
