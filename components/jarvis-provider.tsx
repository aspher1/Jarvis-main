"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { JarvisPlan } from "@/lib/assistant"
import type { PlanQuality } from "@/lib/algos"
import { checkRisk, journalMetrics, type BrokerMode, type Fill, type OrderRequest, type Position, type RiskCheck } from "@/lib/paper"

type Preferences = {
  equity: number
  riskPercent: number
  maxRiskPercent: number
  minRewardRisk: number
  dailyLossPercent: number
  beginnerMode: boolean
  brokerMode: BrokerMode
  liveAcknowledgment: string
  requireLiveFeed: boolean
  safeUnlock: boolean
}

type Config = {
  brokerModeAllowed: boolean
  alpacaConfigured: boolean
  polygonConfigured: boolean
  finnhubConfigured: boolean
}

type JarvisState = {
  watchlist: string[]
  preferences: Preferences
  fills: Fill[]
  positions: Position[]
  activePlan: JarvisPlan | null
  config: Config
  addSymbol: (symbol: string) => void
  removeSymbol: (symbol: string) => void
  updatePreferences: (update: Partial<Preferences>) => void
  applyPlan: (plan: JarvisPlan) => void
  submitOrder: (order: OrderRequest, feedIsLive: boolean, planQuality: PlanQuality) => Promise<{ fill?: Fill; risk: RiskCheck; error?: string }>
  flatten: (symbol: string, price: number) => void
  flattenAll: () => void
  updatePrice: (symbol: string, price: number) => void
  metrics: ReturnType<typeof journalMetrics>
  consecutiveLosses: number
  dailyLocked: boolean
  paperProofCount: number
}

const DEFAULT_PREFERENCES: Preferences = {
  equity: 25_000,
  riskPercent: 0.5,
  maxRiskPercent: 1,
  minRewardRisk: 2,
  dailyLossPercent: 3,
  beginnerMode: true,
  brokerMode: "paper",
  liveAcknowledgment: "",
  requireLiveFeed: true,
  safeUnlock: true,
}

const DEMO_FILLS: Fill[] = [
  { id: "demo-1", symbol: "AAPL", side: "SELL", shares: 18, price: 229.42, stop: 227.9, target: 232.46, mode: "paper", filledAt: Date.now() - 86_400_000, status: "FILLED", ackMs: 22, pnl: 54.72, rResult: 2, hasStop: true },
  { id: "demo-2", symbol: "SPY", side: "SELL", shares: 6, price: 657.18, stop: 658.02, target: 655.5, mode: "paper", filledAt: Date.now() - 43_200_000, status: "FILLED", ackMs: 18, pnl: -30.24, rResult: -1, hasStop: true },
  { id: "demo-3", symbol: "NVDA", side: "SELL", shares: 30, price: 183.88, stop: 182.9, target: 185.84, mode: "paper", filledAt: Date.now() - 21_600_000, status: "FILLED", ackMs: 16, pnl: 58.8, rResult: 2, hasStop: true },
]

const JarvisContext = createContext<JarvisState | null>(null)

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState(["AAPL", "TSLA", "NVDA", "SPY"])
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [fills, setFills] = useState<Fill[]>(DEMO_FILLS)
  const [positions, setPositions] = useState<Position[]>([])
  const [activePlan, setActivePlan] = useState<JarvisPlan | null>(null)
  const [config, setConfig] = useState<Config>({
    brokerModeAllowed: false,
    alpacaConfigured: false,
    polygonConfigured: false,
    finnhubConfigured: false,
  })

  useState(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem("jarvis-state-v1")
      if (stored) {
        const parsed = JSON.parse(stored)
        setWatchlist(parsed.watchlist ?? watchlist)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed.preferences, liveAcknowledgment: "" })
        setFills(parsed.fills ?? DEMO_FILLS)
        setPositions(parsed.positions ?? [])
      }
      fetch("/api/config").then((response) => response.json()).then(setConfig).catch(() => undefined)
    } catch {
      // Corrupt local state falls back to safe defaults.
    }
  })

  const persist = useCallback((next: Partial<{ watchlist: string[]; preferences: Preferences; fills: Fill[]; positions: Position[] }>) => {
    if (typeof window === "undefined") return
    const state = {
      watchlist: next.watchlist ?? watchlist,
      preferences: { ...(next.preferences ?? preferences), liveAcknowledgment: "" },
      fills: next.fills ?? fills,
      positions: next.positions ?? positions,
    }
    window.localStorage.setItem("jarvis-state-v1", JSON.stringify(state))
  }, [fills, positions, preferences, watchlist])

  const addSymbol = (raw: string) => {
    const symbol = raw.toUpperCase().replace(/[^A-Z.-]/g, "").slice(0, 10)
    if (!symbol || watchlist.includes(symbol)) return
    const next = [...watchlist, symbol]
    setWatchlist(next)
    persist({ watchlist: next })
  }
  const removeSymbol = (symbol: string) => {
    const next = watchlist.filter((item) => item !== symbol)
    setWatchlist(next)
    persist({ watchlist: next })
  }
  const updatePreferences = (update: Partial<Preferences>) => {
    const next = { ...preferences, ...update }
    setPreferences(next)
    persist({ preferences: next })
  }
  const applyPlan = (plan: JarvisPlan) => setActivePlan(plan)
  const metrics = useMemo(() => journalMetrics(fills), [fills])
  const closed = fills.filter((fill) => fill.side === "SELL" && !fill.id.startsWith("demo-"))
  const consecutiveLosses = [...closed].reverse().findIndex((fill) => fill.pnl >= 0)
  const dailyLocked = metrics.totalPnl <= -(preferences.equity * preferences.dailyLossPercent) / 100
  const paperProofCount = closed.filter((fill) => fill.hasStop && fill.mode === "paper").length

  const submitOrder: JarvisState["submitOrder"] = async (order, feedIsLive) => {
    const risk = checkRisk(order, {
      equity: preferences.equity,
      maxRiskPercent: preferences.maxRiskPercent,
      minRewardRisk: preferences.minRewardRisk,
      dailyLossPercent: preferences.dailyLossPercent,
    }, metrics.totalPnl, planQuality)
    if (!risk.allowed) return { risk, error: risk.reasons.join(" ") }
    if (consecutiveLosses >= 2) return { risk, error: "Two losses in a row. Take a 15-minute cooldown before another entry." }

    if (order.mode === "live") {
      if (!config.brokerModeAllowed || !config.alpacaConfigured) return { risk, error: "Live broker is not configured on the server." }
      if (preferences.requireLiveFeed && !feedIsLive) return { risk, error: "Live orders need a live price feed. Delayed or demo prices are blocked." }
      if (preferences.liveAcknowledgment !== "I understand this can lose real money") return { risk, error: "Type the full real-money acknowledgment in Settings." }
      if (preferences.safeUnlock && paperProofCount < 10) return { risk, error: `Complete ${10 - paperProofCount} more stopped paper trades to unlock real money.` }
      const response = await fetch("/api/broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, acknowledgment: preferences.liveAcknowledgment, safeUnlockPassed: !preferences.safeUnlock || paperProofCount >= 10 }),
      })
      const result = await response.json()
      if (!response.ok) return { risk, error: result.error }
      setFills((current) => [result.fill, ...current])
      return { risk, fill: result.fill }
    }

    const fill: Fill = { ...order, id: `paper-${crypto.randomUUID()}`, filledAt: Date.now(), status: "FILLED", ackMs: Math.round(8 + Math.random() * 18), pnl: 0, hasStop: Boolean(order.stop) }
    const nextFills = [fill, ...fills]
    const existing = positions.find((position) => position.symbol === order.symbol)
    const nextPositions = existing
      ? positions.map((position) => position.symbol === order.symbol ? { ...position, shares: position.shares + order.shares, currentPrice: order.price } : position)
      : [...positions, { symbol: order.symbol, shares: order.shares, averagePrice: order.price, currentPrice: order.price, stop: order.stop, target: order.target }]
    setFills(nextFills)
    setPositions(nextPositions)
    persist({ fills: nextFills, positions: nextPositions })
    return { risk, fill }
  }

  const flatten = (symbol: string, price: number) => {
    const position = positions.find((item) => item.symbol === symbol)
    if (!position) return
    const pnl = (price - position.averagePrice) * position.shares
    const riskPerShare = Math.max(0.01, position.averagePrice - position.stop)
    const fill: Fill = { symbol, side: "SELL", shares: position.shares, price, stop: position.stop, target: position.target, mode: "paper", id: `paper-${crypto.randomUUID()}`, filledAt: Date.now(), status: "FILLED", ackMs: 12, pnl, rResult: pnl / (riskPerShare * position.shares), hasStop: true }
    const nextFills = [fill, ...fills]
    const nextPositions = positions.filter((item) => item.symbol !== symbol)
    setFills(nextFills)
    setPositions(nextPositions)
    persist({ fills: nextFills, positions: nextPositions })
  }
  const flattenAll = () => positions.forEach((position) => flatten(position.symbol, position.currentPrice))
  const updatePrice = (symbol: string, price: number) => {
    setPositions((current) => current.map((position) => position.symbol === symbol ? { ...position, currentPrice: price } : position))
  }

  return <JarvisContext.Provider value={{ watchlist, preferences, fills, positions, activePlan, config, addSymbol, removeSymbol, updatePreferences, applyPlan, submitOrder, flatten, flattenAll, updatePrice, metrics, consecutiveLosses, dailyLocked, paperProofCount }}>{children}</JarvisContext.Provider>
}

export function useJarvis() {
  const context = useContext(JarvisContext)
  if (!context) throw new Error("useJarvis must be used inside JarvisProvider")
  return context
}
