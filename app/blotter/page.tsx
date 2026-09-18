"use client"

import Link from "next/link"
import { Activity, ArrowRight, ShieldAlert } from "lucide-react"
import { useJarvis } from "@/components/jarvis-provider"
import { Button } from "@/components/ui/button"
import { money, number } from "@/lib/utils"

export default function BlotterPage() {
  const { positions, fills, flatten, flattenAll, metrics, consecutiveLosses } = useJarvis()

  return (
    <div className="p-4">
      <section className="mb-3 grid grid-cols-5 border border-[#2a2a2a] bg-[#141414]">
        <div className="border-r border-[#2a2a2a] p-4">
          <div className="micro">Am I making money?</div>
          <div className={`mono mt-2 text-xl ${metrics.totalPnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{metrics.totalPnl >= 0 ? "▲ " : "▼ "}{money(metrics.totalPnl)}</div>
          <div className="mt-1 text-[10px] text-[#777]">Practice results shown</div>
        </div>
        {[
          ["Win rate", `${number(metrics.winRate, 0)}%`, "Wins out of closed trades"],
          ["Average R", `${number(metrics.avgR)}R`, "Average result versus planned risk"],
          ["Expectancy", money(metrics.expectancy), "Average money made per trade"],
          ["Max drawdown", money(metrics.maxDrawdown), "Largest drop from a high point"],
        ].map(([label, value, help]) => (
          <div key={label} className="border-r border-[#2a2a2a] p-4 last:border-r-0">
            <div className="micro">{label}</div>
            <div className="mono mt-2 text-xl text-white">{value}</div>
            <div className="mt-1 text-[10px] text-[#777]">{help}</div>
          </div>
        ))}
      </section>

      {consecutiveLosses >= 2 ? (
        <div className="mb-3 flex items-center gap-3 border border-[#ffb800] bg-[#1a160b] p-3 text-[#ffd15a]">
          <ShieldAlert className="size-4" />
          <div><strong className="text-xs">Cooldown active after two losses.</strong><p className="mt-0.5 text-[10px] text-[#b8a26c]">Step away for 15 minutes. New entries are blocked.</p></div>
        </div>
      ) : null}

      <section className="panel mb-3">
        <div className="panel-title">
          <span className="micro !text-[#ccc]">Open positions · Practice money</span>
          <Button variant="danger" size="sm" disabled={!positions.length} onClick={flattenAll}>Kill switch · Flatten all</Button>
        </div>
        <div className="grid h-8 grid-cols-[1fr_1fr_1fr_1fr_1fr_120px] items-center border-b border-[#2a2a2a] px-3">
          {["Symbol", "Shares", "Entry", "Last", "Open P&L", "Action"].map((label) => <span key={label} className="micro">{label}</span>)}
        </div>
        {positions.length ? positions.map((position) => {
          const pnl = (position.currentPrice - position.averagePrice) * position.shares
          return (
            <div key={position.symbol} className="grid min-h-12 grid-cols-[1fr_1fr_1fr_1fr_1fr_120px] items-center border-b border-[#2a2a2a] px-3 last:border-b-0">
              <strong className="mono text-white">{position.symbol}</strong>
              <span className="mono">{position.shares}</span>
              <span className="mono">{money(position.averagePrice)}</span>
              <span className="mono">{money(position.currentPrice)}</span>
              <span className={`mono ${pnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{pnl >= 0 ? "▲ " : "▼ "}{money(pnl)}</span>
              <Button size="sm" variant="danger" onClick={() => flatten(position.symbol, position.currentPrice)}>Flatten</Button>
            </div>
          )
        }) : (
          <div className="flex min-h-28 items-center justify-center gap-3 text-xs text-[#777]">
            <Activity className="size-4" /> No open positions. Apply a plan, then place a Paper order.
            <Button asChild size="sm"><Link href="/trade/AAPL">Open AAPL <ArrowRight className="size-3" /></Link></Button>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title"><span className="micro !text-[#ccc]">Fills + journal</span><span className="micro">{fills.length} events</span></div>
        <div className="grid h-8 grid-cols-[1.2fr_.7fr_.8fr_1fr_1fr_1fr] items-center border-b border-[#2a2a2a] px-3">
          {["Time", "Symbol", "Side", "Fill", "P&L", "Submit → ack"].map((label) => <span key={label} className="micro">{label}</span>)}
        </div>
        {fills.map((fill) => (
          <div key={fill.id} className="grid min-h-11 grid-cols-[1.2fr_.7fr_.8fr_1fr_1fr_1fr] items-center border-b border-[#2a2a2a] px-3 last:border-b-0">
            <span className="mono text-[10px] text-[#888]">{new Date(fill.filledAt).toLocaleString()}</span>
            <strong className="mono text-white">{fill.symbol}</strong>
            <span className={`text-[10px] font-bold ${fill.side === "BUY" ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{fill.side}</span>
            <span className="mono">{fill.shares} @ {number(fill.price)}</span>
            <span className={`mono ${fill.pnl >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>{fill.pnl >= 0 ? "▲ " : "▼ "}{money(fill.pnl)}</span>
            <span className="mono text-[#888]">{fill.ackMs}ms · {fill.mode.toUpperCase()}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
