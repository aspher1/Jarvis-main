"use client"

import { Check, Radio, ShieldCheck, Zap } from "lucide-react"
import { ChartHud } from "@/components/hud/chart-hud"
import { Button } from "@/components/ui/button"
import { breakout } from "@/lib/algos"
import type { JarvisPlan } from "@/lib/assistant"
import { mockCandles, type Quote } from "@/lib/market"
import { positionSize } from "@/lib/paper"
import { money, number } from "@/lib/utils"

const candles = mockCandles("AAPL")
const signal = breakout("AAPL", candles)[0]
const plan: JarvisPlan = {
  ...signal,
  shares: positionSize(25_000, 0.5, signal.entry, signal.stop),
  createdAt: 0,
  disclaimer: "Not financial advice. This is a plan helper — profits are never guaranteed.",
  checklist: ["Check entry", "Set stop", "Place order"],
  feedWarning: "Demo prices are not for live trading.",
}
const last = candles.at(-1)!.close
const quote: Quote = {
  symbol: "AAPL",
  price: last,
  bid: last - 0.02,
  ask: last + 0.02,
  change: 1.84,
  changePercent: 0.8,
  timestamp: Date.now(),
  feed: "mock",
  provider: "Jarvis demo stream",
  lagMs: 0,
}

export default function HudDemoPage() {
  return (
    <div className="p-3">
      <div className="mb-2 flex h-10 items-center border border-[#2a2a2a] bg-[#141414] px-3">
        <strong className="mono text-base text-white">AAPL</strong>
        <span className="mono ml-3 text-sm text-white">{money(quote.price)}</span>
        <span className="ml-3 border border-[#ffb800] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ffb800]">Prices: Mock demo</span>
        <span className="ml-2 border border-[#ffb800] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ffb800]">Demo analysis · FREE local</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase text-[#00d4aa]"><Radio className="size-3" /> Same stream → chart + analysis</span>
      </div>

      <div className="grid h-[calc(100vh-126px)] min-h-[720px] grid-cols-[minmax(700px,1fr)_370px]">
        <section className="border border-[#2a2a2a]">
          <ChartHud candles={candles} quote={quote} plan={plan} modules={{ esp: true }} />
        </section>
        <aside className="border-y border-r border-[#2a2a2a] bg-[#121212]">
          <div className="panel-title"><span className="micro !text-[#ccc]">Jarvis plan · Applied</span><span className="micro !text-[#00d4aa]">Waypoints locked</span></div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div><span className="micro block">Plan quality</span><strong className="mt-1 block text-sm text-[#00d4aa]">{plan.quality} · {plan.rewardRisk.toFixed(1)}R</strong></div>
              <span className="flex size-8 items-center justify-center border border-[#00d4aa] text-[#00d4aa]"><Zap className="size-4" /></span>
            </div>
            <p className="mt-3 border-l-2 border-[#00d4aa] bg-[#0c1b18] p-3 text-xs leading-5 text-white">
              Buy only inside the Buy Zone. Set the Stop first. Take some profit at Target 1.
            </p>
            <div className="mt-3 grid grid-cols-2 border-l border-t border-[#2a2a2a]">
              {[
                ["BUY ZONE — HERE", plan.entry, "#00d4aa"],
                ["GET OUT IF WRONG", plan.stop, "#ff4757"],
                ["TAKE PROFIT — T1", plan.target1, "#a6ff4d"],
                ["SHARES", plan.shares, "#ffffff"],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="border-b border-r border-[#2a2a2a] p-3">
                  <span className="micro block">{label}</span>
                  <strong className="mono mt-1 block text-xl" style={{ color: String(color) }}>{number(Number(value), label === "SHARES" ? 0 : 2)}</strong>
                </div>
              ))}
            </div>
            <details open className="border-x border-b border-[#2a2a2a] p-3">
              <summary className="cursor-pointer text-[11px] font-semibold text-white">Why this plan? · Options-desk view</summary>
              <p className="mt-2 text-[10px] leading-4 text-[#999]">{plan.reason} {plan.invalidation}</p>
              <div className="mt-3 grid grid-cols-2 gap-px bg-[#2a2a2a]">
                {[
                  ["Desk bias", plan.desk.bias],
                  ["VWAP", number(plan.desk.vwap)],
                  ["Prior high / low", `${number(plan.desk.priorHigh)} / ${number(plan.desk.priorLow)}`],
                  ["Opening range", `${number(plan.desk.openingRangeLow)}–${number(plan.desk.openingRangeHigh)}`],
                ].map(([label, value]) => <div key={label} className="bg-[#101010] p-2"><span className="micro block">{label}</span><span className="mono mt-1 block text-[10px] text-[#ddd]">{value}</span></div>)}
              </div>
            </details>
            <div className="mt-3 border-l-2 border-[#00d4aa] bg-[#0d1b18] p-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#00d4aa]"><span className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> Risk gate passed</span><span className="mono">{money(125)} max loss</span></div>
              <p className="mt-1 text-[10px] text-[#819991]">Size is inside the 0.5% risk plan. Target 1 meets the 2R minimum.</p>
            </div>
            <ol className="mt-3 grid grid-cols-3 gap-px bg-[#2a2a2a]">
              {plan.checklist.map((item, index) => <li key={item} className="bg-[#141414] p-2 text-[10px] text-[#aaa]"><span className="mono mr-1 text-[#00d4aa]">{index + 1}</span>{item}</li>)}
            </ol>
            <Button variant="primary" size="lg" className="mt-3 w-full"><Check className="size-4" /> Place PAPER order</Button>
            <p className="mt-3 text-[9px] leading-4 text-[#777]">{plan.disclaimer} Trading can lose money, including your full account.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
