"use client"

import { useMemo, useState } from "react"
import { Bot, Check, ChevronDown, Copy, Crosshair, Radio, Send, Shield, Zap } from "lucide-react"
import { ALGO_RUNNERS, type AlgoName, type Signal } from "@/lib/algos"
import { LocalStructuredAssistant, type JarvisPlan } from "@/lib/assistant"
import { COPY_LEADERS, leaderSignal } from "@/lib/copytrade"
import { feedLabel } from "@/lib/market/types"
import { useMarket } from "@/lib/market/use-market"
import { positionSize } from "@/lib/paper"
import { money, number } from "@/lib/utils"
import { ChartHud } from "@/components/hud/chart-hud"
import { useJarvis } from "@/components/jarvis-provider"
import { Button } from "@/components/ui/button"
import { CoachOverlay } from "@/components/coach-overlay"

const MODULES = [
  { key: "esp", name: "ESP Levels", help: "Shows where to buy, take profit, and get out." },
  { key: "algo", name: "Algo Radar", help: "Scans three rule-based plan types." },
  { key: "copy", name: "Copy Aura", help: "Shows simulated leader ideas." },
  { key: "risk", name: "Risk Calc", help: "Keeps each loss inside your limit." },
  { key: "chat", name: "Jarvis Chat", help: "Explains the plan in plain English." },
] as const

const assistant = new LocalStructuredAssistant()

export function Cockpit({ symbol }: { symbol: string }) {
  const { quote, candles, error } = useMarket(symbol)
  const { preferences, activePlan, applyPlan, submitOrder } = useJarvis()
  const [modules, setModules] = useState<Record<string, boolean>>({ esp: true, algo: true, copy: true, risk: true, chat: true })
  const [algos, setAlgos] = useState<Record<AlgoName, boolean>>({ TrendFollow: true, MeanRevert: false, Breakout: true })
  const [pendingPlan, setPendingPlan] = useState<JarvisPlan | null>(null)
  const [message, setMessage] = useState("What’s a plan for today?")
  const [notice, setNotice] = useState("Turn on modules, then ask Jarvis for a plan.")
  const [busy, setBusy] = useState(false)

  const signals = useMemo(() => {
    if (!candles.length || !modules.algo) return []
    return (Object.keys(algos) as AlgoName[]).flatMap((algo) => algos[algo] ? ALGO_RUNNERS[algo](symbol, candles) : [])
  }, [algos, candles, modules.algo, symbol])

  const plan = activePlan?.symbol === symbol ? activePlan : null
  const displayPlan = pendingPlan ?? plan
  const shares = displayPlan ? positionSize(preferences.equity, preferences.riskPercent, displayPlan.entry, displayPlan.stop) : 0

  async function askJarvis(signalPool = signals) {
    setBusy(true)
    try {
      const next = await assistant.propose({ symbol, equity: preferences.equity, riskPercent: preferences.riskPercent, feed: quote?.feed ?? "mock", signals: signalPool })
      setPendingPlan(next)
      setNotice(`${next.quality} plan found. Check the four numbers, then apply it to the chart.`)
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Jarvis could not build a plan.")
    } finally {
      setBusy(false)
    }
  }

  function followLeader(leaderId: string, signal: Signal) {
    void askJarvis([leaderSignal(leaderId, signal)])
  }

  async function placeOrder() {
    if (!plan || !quote) {
      setNotice("Apply a Jarvis plan before placing an order.")
      return
    }
    if (plan.quality === "Skip") {
      setNotice("Plan quality is Skip — Place Order is blocked.")
      return
    }
    const result = await submitOrder({
      symbol,
      side: "BUY",
      shares,
      price: quote.price,
      stop: plan.stop,
      target: plan.target1,
      mode: preferences.brokerMode,
    }, quote.feed === "live", plan.quality)
    setNotice(result.error ?? `${preferences.brokerMode === "live" ? "LIVE" : "PAPER"} order filled in ${result.fill?.ackMs}ms.`)
  }

  return (
    <div className="relative p-3">
      <CoachOverlay context="trade" />
      <div className="mb-2 flex h-10 items-center border border-[#2a2a2a] bg-[#141414] px-3">
        <div className="flex items-center gap-3">
          <Crosshair className="size-4 text-[#00d4aa]" />
          <strong className="mono text-base text-white">{symbol}</strong>
          <span className="mono text-sm text-white">{quote ? money(quote.price) : "Connecting"}</span>
          {quote ? <span className="border border-[#2a2a2a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00d4aa]">{feedLabel(quote)}</span> : null}
          {error ? <span className="text-[10px] uppercase text-[#ff4757]">{error}</span> : null}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="micro">Same stream → chart + last price</span>
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#00d4aa]"><Radio className="size-3" /> Stream connected</span>
        </div>
      </div>

      <div className="grid h-[calc(100vh-126px)] min-h-[720px] grid-cols-[minmax(650px,1fr)_290px_330px] grid-rows-[minmax(470px,1fr)_240px]">
        <section className="border border-[#2a2a2a]">
          <ChartHud candles={candles} quote={quote} plan={plan} modules={modules} />
        </section>

        <aside className="border-y border-r border-[#2a2a2a] bg-[#141414]">
          <div className="panel-title">
            <span className="micro !text-[#cfcfcf]">Module GUI</span>
            <span className="mono text-[9px] text-[#00d4aa]">RSHIFT</span>
          </div>
          {MODULES.map((module) => (
            <button
              key={module.key}
              onClick={() => setModules((current) => ({ ...current, [module.key]: !current[module.key] }))}
              className="flex w-full items-start gap-3 border-b border-[#2a2a2a] p-3 text-left hover:bg-[#191919]"
            >
              <span className={`mt-0.5 flex size-4 items-center justify-center border ${modules[module.key] ? "border-[#00d4aa] bg-[#00d4aa] text-black" : "border-[#555] text-transparent"}`}>
                <Check className="size-3" />
              </span>
              <span>
                <strong className={`block font-mono text-[11px] uppercase ${modules[module.key] ? "text-white" : "text-[#666]"}`}>{module.name} · {modules[module.key] ? "ON" : "OFF"}</strong>
                <span className="mt-1 block text-[10px] leading-4 text-[#777]">{module.help}</span>
              </span>
            </button>
          ))}
          <div className="panel-title border-t border-[#2a2a2a]"><span className="micro !text-[#cfcfcf]">Algo Radar</span></div>
          {(Object.keys(algos) as AlgoName[]).map((algo) => (
            <button key={algo} onClick={() => setAlgos((current) => ({ ...current, [algo]: !current[algo] }))} className="flex w-full items-center justify-between border-b border-[#2a2a2a] px-3 py-2 text-left">
              <span className="font-mono text-[10px] text-[#aaa]">{algo}</span>
              <span className={`font-mono text-[9px] ${algos[algo] ? "text-[#a6ff4d]" : "text-[#666]"}`}>{algos[algo] ? "● ON" : "○ OFF"}</span>
            </button>
          ))}
        </aside>

        <aside className="row-span-2 border-y border-r border-[#2a2a2a] bg-[#121212]">
          <div className="panel-title">
            <span className="flex items-center gap-2 micro !text-[#cfcfcf]"><Bot className="size-3 text-[#00d4aa]" /> Jarvis assistant</span>
            <span className="micro !text-[#00d4aa]">Local planner</span>
          </div>
          <div className="border-b border-[#2a2a2a] p-3">
            <div className="border-l-2 border-[#00d4aa] bg-[#101a18] p-3 text-xs leading-5 text-[#d4d4d4]">{notice}</div>
            {displayPlan ? (
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="micro">Plan quality</span>
                  <span className={`border px-2 py-1 text-[10px] font-bold uppercase ${displayPlan.quality === "Strong" ? "border-[#00d4aa] text-[#00d4aa]" : displayPlan.quality === "Skip" ? "border-[#ff4757] text-[#ff4757]" : "border-[#ffb800] text-[#ffb800]"}`}>{displayPlan.quality}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-white">{displayPlan.plainEnglish}</p>
                <div className="mt-3 grid grid-cols-2 border-l border-t border-[#2a2a2a]">
                  {[
                    ["Entry · Buy here", displayPlan.entry, "#00d4aa"],
                    ["Stop · Get out", displayPlan.stop, "#ff4757"],
                    ["Target · Take profit", displayPlan.target1, "#a6ff4d"],
                    ["Shares", shares, "#ffffff"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="border-b border-r border-[#2a2a2a] p-3">
                      <span className="micro block">{label}</span>
                      <strong className="mono mt-1 block text-xl" style={{ color: String(color) }}>{number(Number(value), Number(label === "Shares" ? 0 : 2))}</strong>
                    </div>
                  ))}
                </div>
                <details className="border-x border-b border-[#2a2a2a] p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold text-[#aaa]">Why this plan? <ChevronDown className="size-3" /></summary>
                  <p className="mt-2 text-[11px] leading-5 text-[#888]">{assistant.explain(displayPlan)}</p>
                </details>
                {displayPlan.feedWarning ? <p className="mt-2 border border-[#ffb800] p-2 text-[10px] leading-4 text-[#ffcc45]">{displayPlan.feedWarning}</p> : null}
                <ol className="mt-3 grid grid-cols-3 gap-px bg-[#2a2a2a]">
                  {displayPlan.checklist.map((item, index) => <li key={item} className="bg-[#141414] p-2 text-[10px] text-[#aaa]"><span className="mono mr-1 text-[#00d4aa]">{index + 1}</span> {item}</li>)}
                </ol>
                {pendingPlan ? (
                  <Button variant="primary" size="lg" className="mt-3 w-full" onClick={() => { applyPlan(pendingPlan); setPendingPlan(null); setNotice("Waypoints locked on the chart. Check the order, then place it."); }}>
                    <Zap className="size-4" /> Apply Jarvis plan
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" className="mt-3 w-full" disabled={plan?.quality === "Skip"} onClick={() => void placeOrder()}>
                    <Shield className="size-4" /> Place {preferences.brokerMode === "live" ? "LIVE" : "PAPER"} order
                  </Button>
                )}
              </div>
            ) : null}
          </div>
          <form className="flex border-b border-[#2a2a2a]" onSubmit={(event) => { event.preventDefault(); void askJarvis(); }}>
            <input className="h-11 min-w-0 flex-1 bg-[#0d0d0d] px-3 text-xs text-white outline-none" value={message} onChange={(event) => setMessage(event.target.value)} aria-label="Ask Jarvis" />
            <Button type="submit" variant="primary" className="h-11" disabled={busy}><Send className="size-3.5" /> Ask</Button>
          </form>
          <p className="p-3 text-[10px] leading-4 text-[#666]">Not financial advice. You are responsible for orders. Trading can lose money, including your full account.</p>
        </aside>

        <section className="col-span-2 grid grid-cols-[1fr_1fr] border-x border-b border-[#2a2a2a] bg-[#141414]">
          <div className="border-r border-[#2a2a2a]">
            <div className="panel-title"><span className="micro !text-[#cfcfcf]">Algo signals</span><span className="micro">{signals.length} found</span></div>
            <div className="grid h-[207px] grid-cols-2 overflow-auto">
              {signals.map((signal) => (
                <div key={signal.id} className="border-b border-r border-[#2a2a2a] p-3">
                  <div className="flex justify-between"><strong className="font-mono text-[11px] text-white">{signal.algo}</strong><span className="text-[10px] font-bold text-[#00d4aa]">{signal.quality}</span></div>
                  <p className="mt-2 text-[11px] leading-4 text-[#aaa]">In plain English: {signal.plainEnglish}</p>
                  <div className="mono mt-2 text-[10px] text-[#777]">BUY {number(signal.entry)} · STOP {number(signal.stop)} · {signal.rewardRisk}R</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="panel-title"><span className="micro !text-[#cfcfcf]">Copy Aura · Simulated leaders</span><span className="micro">Not real accounts</span></div>
            <div className="grid h-[207px] grid-cols-3">
              {COPY_LEADERS.map((leader) => (
                <div key={leader.id} className="border-r border-[#2a2a2a] p-3 last:border-r-0">
                  <Copy className="size-3.5 text-[#ffb800]" />
                  <strong className="mt-2 block font-mono text-[11px] text-white">{leader.name}</strong>
                  <span className="mt-1 block text-[9px] uppercase text-[#777]">{leader.trackRecord}</span>
                  <p className="mt-2 text-[10px] leading-4 text-[#aaa]">In plain English: {leader.note}</p>
                  <Button size="sm" className="mt-2 w-full" disabled={!signals[0]} onClick={() => signals[0] && followLeader(leader.id, signals[0])}>Follow → prefill</Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
