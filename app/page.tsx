"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Crosshair, Plus, ShieldCheck, Trash2, TrendingUp } from "lucide-react"
import { CoachOverlay } from "@/components/coach-overlay"
import { useJarvis } from "@/components/jarvis-provider"
import { Button } from "@/components/ui/button"
import { feedLabel } from "@/lib/market/types"
import { useMarket } from "@/lib/market/use-market"
import { money, number } from "@/lib/utils"

function SymbolRow({ symbol }: { symbol: string }) {
  const { quote } = useMarket(symbol)
  const { removeSymbol } = useJarvis()
  const positive = (quote?.change ?? 0) >= 0
  return (
    <div className="grid min-h-16 grid-cols-[1.2fr_1fr_1fr_1.3fr_140px_40px] items-center border-b border-[#2a2a2a] px-3 last:border-b-0 hover:bg-[#171717]">
      <div>
        <span className="mono text-sm font-bold text-white">{symbol}</span>
        <span className="ml-2 text-[10px] uppercase text-[#666]">US Equity</span>
      </div>
      <div className="mono text-sm text-white">{quote ? money(quote.price) : "—"}</div>
      <div className={`mono text-xs ${positive ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
        {quote ? `${positive ? "▲ BUY" : "▼ SELL"} ${number(Math.abs(quote.changePercent))}%` : "Loading"}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#888]">
        {quote ? feedLabel(quote) : "Connecting to prices"}
      </div>
      <Button asChild variant="secondary">
        <Link href={`/trade/${symbol}`}>
          Open cockpit <ArrowRight className="size-3" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" aria-label={`Remove ${symbol}`} onClick={() => removeSymbol(symbol)}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

export default function HomePage() {
  const { watchlist, addSymbol, preferences, metrics } = useJarvis()
  const [symbol, setSymbol] = useState("")

  return (
    <div className="p-4">
      <CoachOverlay context="home" />
      <section className="mb-4 grid grid-cols-[1fr_240px_240px_240px] border border-[#2a2a2a] bg-[#141414]">
        <div className="border-r border-[#2a2a2a] p-5">
          <div className="micro mb-2 !text-[#00d4aa]">Mission control / Watchlist</div>
          <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-white">
            Pick a stock. Jarvis marks where to buy, take profit, and get out.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8e8e8e]">
            Mod-style chart waypoints make the plan visible. Risk gates help protect your account before an order can leave.
          </p>
        </div>
        <div className="border-r border-[#2a2a2a] p-4">
          <div className="micro">Account equity</div>
          <div className="mono mt-3 text-xl text-white">{money(preferences.equity)}</div>
          <div className="mt-1 text-[11px] text-[#777]">Max {preferences.maxRiskPercent}% risk per trade</div>
        </div>
        <div className="border-r border-[#2a2a2a] p-4">
          <div className="micro">Practice expectancy</div>
          <div className={`mono mt-3 text-xl ${metrics.expectancy >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
            {metrics.expectancy >= 0 ? "▲ " : "▼ "}{money(metrics.expectancy)} / trade
          </div>
          <div className="mt-1 text-[11px] text-[#777]">Demo journal data</div>
        </div>
        <div className="p-4">
          <div className="micro">Safety state</div>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#00d4aa]">
            <ShieldCheck className="size-4" /> Risk gates armed
          </div>
          <div className="mt-1 text-[11px] text-[#777]">Practice money by default</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div className="flex items-center gap-2">
            <Crosshair className="size-3.5 text-[#00d4aa]" />
            <span className="micro !text-[#c8c8c8]">Tracked markets</span>
            <span className="mono text-[10px] text-[#666]">{watchlist.length.toString().padStart(2, "0")}</span>
          </div>
          <form
            className="flex h-full items-center"
            onSubmit={(event) => {
              event.preventDefault()
              addSymbol(symbol)
              setSymbol("")
            }}
          >
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              placeholder="ADD SYMBOL, E.G. AMD"
              aria-label="Stock symbol"
              className="mono h-8 w-52 border-x border-[#2a2a2a] bg-[#101010] px-3 text-[11px] uppercase text-white outline-none focus:border-[#00d4aa]"
            />
            <Button type="submit" variant="primary" size="sm" className="h-8">
              <Plus className="size-3" /> Add to watchlist
            </Button>
          </form>
        </div>
        <div className="grid h-8 grid-cols-[1.2fr_1fr_1fr_1.3fr_140px_40px] items-center border-b border-[#2a2a2a] px-3">
          {["Symbol", "Last price", "Today", "Price source", "Action", ""].map((label) => <span key={label} className="micro">{label}</span>)}
        </div>
        {watchlist.length ? watchlist.map((item) => <SymbolRow key={item} symbol={item} />) : (
          <div className="flex min-h-52 flex-col items-center justify-center">
            <TrendingUp className="mb-3 size-7 text-[#555]" />
            <p className="text-sm text-white">Your watchlist is empty.</p>
            <p className="mt-1 text-xs text-[#777]">Add AAPL to start seeing price plans.</p>
          </div>
        )}
      </section>
    </div>
  )
}
