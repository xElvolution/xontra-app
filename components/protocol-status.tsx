import { Card } from "@/components/ui/card"

export function ProtocolStatus() {
  const protocols = [
    {
      name: "Ethereum",
      load: "67%",
      nodes: "7,432",
      status: "ONLINE",
      statusColor: "text-teal-400",
      bgColor: "bg-teal-500/20",
      borderColor: "border-teal-500/30",
      icon: "⟠",
    },
    {
      name: "Arbitrum",
      load: "23%",
      nodes: "1,247",
      status: "ONLINE",
      statusColor: "text-teal-400",
      bgColor: "bg-teal-500/20",
      borderColor: "border-teal-500/30",
      icon: "◈",
    },
    {
      name: "Optimism",
      load: "45%",
      nodes: "892",
      status: "SYNCING",
      statusColor: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
      icon: "○",
    },
    {
      name: "Polygon",
      load: "34%",
      nodes: "2,156",
      status: "ONLINE",
      statusColor: "text-teal-400",
      bgColor: "bg-teal-500/20",
      borderColor: "border-teal-500/30",
      icon: "⬟",
    },
  ]

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">PROTOCOL STATUS</h2>
      </div>

      <div className="space-y-4">
        {protocols.map((protocol) => (
          <div
            key={protocol.name}
            className={`p-4 bg-slate-800/50 rounded-lg border ${protocol.borderColor} hover:bg-slate-800/70 transition-colors`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${protocol.bgColor} rounded-lg flex items-center justify-center border ${protocol.borderColor}`}
                >
                  <span className="text-xl">{protocol.icon}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{protocol.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Load:</span>
                    <span className="text-slate-300 text-sm">{protocol.load}</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 ${protocol.bgColor} rounded-full border ${protocol.borderColor}`}>
                <span className={`text-xs font-medium ${protocol.statusColor}`}>{protocol.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 text-xs">Nodes:</span>
                  <span className="text-white text-sm ml-1">{protocol.nodes}</span>
                </div>
              </div>
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${protocol.status === "ONLINE" ? "bg-teal-400" : "bg-yellow-400"} transition-all duration-300`}
                  style={{ width: protocol.load }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
