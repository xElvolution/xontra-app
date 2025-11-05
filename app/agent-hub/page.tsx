"use client"

import { Navigation } from "@/components/navigation"
import { WalletDrawer } from "@/components/wallet-drawer"
import { Footer } from "@/components/footer"
import { useState } from "react"
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Zap, Moon, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function AgentHubPage() {
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(SUPPORTED_CHAINS[0])

  // Agent state
  const [minted, setMinted] = useState(false)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0) // progress within current level
  const [energy, setEnergy] = useState(60)
  const [streak, setStreak] = useState(0)
  const [lastCareDate, setLastCareDate] = useState<string | null>(null)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)
  const [isMintModalOpen, setIsMintModalOpen] = useState(false)
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false)
  const [xpPopup, setXpPopup] = useState<{ key: number; amount: number } | null>(null)
  const [resting, setResting] = useState(false)

  // Persistence
  const save = (
    next?: Partial<{
      minted: boolean
      level: number
      xp: number
      energy: number
      streak: number
      lastCareDate: string | null
      lastClaimDate: string | null
    }>
  ) => {
    const state = {
      minted,
      level,
      xp,
      energy,
      streak,
      lastCareDate,
      lastClaimDate,
      ...next,
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("xontra:agent", JSON.stringify(state))
    }
  }

  // Load on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("xontra:agent")
      if (raw) {
        try {
          const s = JSON.parse(raw)
          setMinted(!!s.minted)
          setLevel(s.level ?? 1)
          setXp(s.xp ?? 0)
          setEnergy(s.energy ?? 60)
          setStreak(s.streak ?? 0)
          setLastCareDate(s.lastCareDate ?? null)
          setLastClaimDate(s.lastClaimDate ?? null)
        } catch {}
      }
    }
  })

  const levelThreshold = (lvl: number) => 100 + (lvl - 1) * 20
  const addXp = (amount: number) => {
    let nxp = xp + amount
    let nlvl = level
    while (nxp >= levelThreshold(nlvl)) {
      nxp -= levelThreshold(nlvl)
      nlvl += 1
      // confetti-like popup could be simulated via xpPopup + larger amount
    }
    setXp(nxp)
    setLevel(nlvl)
    setXpPopup({ key: Date.now(), amount })
    save({ xp: nxp, level: nlvl })
  }

  const updateStreak = () => {
    const today = new Date().toDateString()
    if (lastCareDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const ns = lastCareDate === yesterday ? streak + 1 : 1
      setStreak(ns)
      setLastCareDate(today)
      save({ streak: ns, lastCareDate: today })
    }
  }

  // Derived mood
  const mood = energy >= 70 ? "Happy" : energy >= 40 ? "Calm" : energy >= 20 ? "Tired" : resting ? "Sleeping" : "Hungry"

  // Actions
  const onFeed = () => {
    if (energy >= 100) return
    const ne = Math.min(100, energy + 20)
    setEnergy(ne)
    addXp(5)
    updateStreak()
    save({ energy: ne })
  }

  const onPlay = () => {
    setIsPlayModalOpen(true)
  }

  const confirmPlay = () => {
    setIsPlayModalOpen(false)
    const ne = Math.max(0, energy - 15)
    setEnergy(ne)
    addXp(10)
    updateStreak()
    save({ energy: ne })
  }

  const onRest = async () => {
    if (resting) return
    setResting(true)
    setTimeout(() => {
      const ne = Math.min(100, energy + 25)
      setEnergy(ne)
      addXp(3)
      updateStreak()
      setResting(false)
      save({ energy: ne })
    }, 2000)
  }

  const claimDaily = () => {
    const today = new Date().toDateString()
    if (lastClaimDate === today) return
    const bonus = 5 + Math.min(20, streak) // small bonus scaling with streak
    addXp(bonus)
    setLastClaimDate(today)
    save({ lastClaimDate: today })
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
            fill="url(#wave1)"
            className="animate-pulse"
          />
          <path
            d="M0,400 Q300,300 600,400 T1200,400 Q900,500 600,400 T0,400"
            fill="url(#wave2)"
            className="animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <path
            d="M0,600 Q300,500 600,600 T1200,600 Q900,700 600,600 T0,600"
            fill="url(#wave3)"
            className="animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </svg>

        {/* Animated gradient overlays */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"></div>
          <div
            className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen min-h-[100dvh] mobile-safe-area">
        <Navigation 
          onWalletClick={() => setIsWalletDrawerOpen(true)} 
          onChainChange={setSelectedChain}
        />

        <div className="flex-1 flex gap-6 p-3 sm:p-6 mt-16">
          <div className="flex-1 max-w-5xl mx-auto space-y-8 flex flex-col w-full">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-7 w-7 text-purple-400" />
                <h1 className="text-3xl sm:text-4xl font-bold">Your Xontra Agent</h1>
              </div>
              <p className="text-slate-300">Feed. Play. Rest. Evolve.</p>
              <div className="flex justify-center">
                <Button onClick={() => setIsMintModalOpen(true)} className="bg-black hover:bg-black/80 text-white rounded-lg px-4 py-2 text-sm">Mint Agent NFT</Button>
              </div>
            </div>

            {/* Agent Display */}
            <Card className="bg-slate-900/40 border-slate-800">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ scale: resting ? 0.95 : 1, rotate: mood === 'Happy' ? [0, 2, -2, 0] : 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-28 h-28 rounded-full flex items-center justify-center shadow-lg ${
                      mood === 'Happy' ? 'bg-green-500/30' : mood === 'Tired' ? 'bg-yellow-500/20' : mood === 'Hungry' ? 'bg-red-500/20' : 'bg-purple-500/20'
                    }`}
                  >
                    <motion.div animate={{ y: resting ? 4 : 0 }} className="w-16 h-16 rounded-full bg-purple-400/60" />
                  </motion.div>
                  <div className="text-slate-300 text-sm">Mood: <span className="text-white font-medium">{mood}</span></div>

                  {/* Bars */}
                  <div className="w-full max-w-md space-y-2">
                    <div className="text-xs text-slate-400">Energy</div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-2 bg-gradient-to-r from-green-500 to-cyan-500" style={{ width: `${energy}%` }} />
                    </div>
                    <div className="text-xs text-slate-400 mt-2">XP</div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${(xp / levelThreshold(level)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Level {level}</span>
                      <span>{xp}/{levelThreshold(level)} XP</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={onFeed} disabled={energy >= 100} className="bg-slate-900/60 border border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-2 py-6">
                <span>🍗</span>
                <Zap className="w-4 h-4" />
                <span>Feed (DATA)</span>
              </Button>
              <Button onClick={onPlay} className="bg-slate-900/60 border border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-2 py-6">
                <span>🎮</span>
                <MessageSquare className="w-4 h-4" />
                <span>Play</span>
              </Button>
              <Button onClick={onRest} className="bg-slate-900/60 border border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-2 py-6">
                <span>🌙</span>
                <Moon className="w-4 h-4" />
                <span>Rest</span>
              </Button>
            </div>

            {/* Stats + Daily */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader>
                  <CardTitle>Agent Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Level</span><span className="text-white">{level}</span></div>
                  <div className="flex justify-between"><span>XP</span><span className="text-white">{xp}/{levelThreshold(level)}</span></div>
                  <div className="flex justify-between"><span>Energy</span><span className="text-white">{energy}%</span></div>
                  <div className="flex justify-between"><span>Mood</span><span className="text-white">{mood}</span></div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader>
                  <CardTitle>Daily Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-slate-300 text-sm">You’ve cared for your Agent <span className="text-white font-medium">{streak}</span> days in a row!</div>
                  <Button onClick={claimDaily} className="bg-black hover:bg-black/80 text-white rounded-lg px-4 py-2 text-sm">Claim Daily XP</Button>
                </CardContent>
              </Card>
            </div>

            {/* XP popup */}
            <AnimatePresence>
              {xpPopup && (
                <motion.div key={xpPopup.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-sm px-3 py-1 rounded-full">
                  +{xpPopup.amount} XP
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mint modal */}
            <AnimatePresence>
              {isMintModalOpen && (
                <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                    <h3 className="text-lg font-semibold mb-2">Mint Agent NFT</h3>
                    <p className="text-slate-300 text-sm mb-4">Minting happens on the AI Agents NFT page. For now, we’ll simulate your first Agent so you can start bonding.</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="border-slate-700" onClick={() => setIsMintModalOpen(false)}>Cancel</Button>
                      <Button className="bg-black hover:bg-black/80 text-white" onClick={() => { setMinted(true); setIsMintModalOpen(false); addXp(10) }}>Simulate Mint</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play modal */}
            <AnimatePresence>
              {isPlayModalOpen && (
                <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                    <h3 className="text-lg font-semibold mb-2">Play Session</h3>
                    <p className="text-slate-300 text-sm mb-4">Your agent says: “Let’s learn something new!”</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="border-slate-700" onClick={() => setIsPlayModalOpen(false)}>Not now</Button>
                      <Button className="bg-black hover:bg-black/80 text-white" onClick={confirmPlay}>Play & Learn</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
