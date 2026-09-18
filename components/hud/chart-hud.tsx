"use client"

import { useEffect, useMemo, useRef } from "react"
import { CandlestickSeries, ColorType, createChart, HistogramSeries, type IChartApi, type UTCTimestamp } from "lightweight-charts"
import type { JarvisPlan } from "@/lib/assistant"
import type { Candle, Quote } from "@/lib/market"
import { number } from "@/lib/utils"

function levelPosition(value: number, candles: Candle[]) {
  const relevant = candles.slice(-50)
  const high = Math.max(...relevant.map((candle) => candle.high), value)
  const low = Math.min(...relevant.map((candle) => candle.low), value)
  return 8 + ((high - value) / Math.max(0.01, high - low)) * 82
}

export function ChartHud({ candles, quote, plan, modules }: {
  candles: Candle[]
  quote: Quote | null
  plan: JarvisPlan | null
  modules: Record<string, boolean>
}) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi | null>(null)
  const series = useRef<ReturnType<IChartApi["addSeries"]> | null>(null)

  useEffect(() => {
    if (!container.current) return
    const nextChart = createChart(container.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "#0d0f0f" }, textColor: "#707777", fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
      grid: { vertLines: { color: "#171b1b" }, horzLines: { color: "#1c2020" } },
      rightPriceScale: { borderColor: "#2a2a2a", scaleMargins: { top: 0.08, bottom: 0.18 } },
      timeScale: { borderColor: "#2a2a2a", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#00d4aa55", labelBackgroundColor: "#006b58" }, horzLine: { color: "#00d4aa55", labelBackgroundColor: "#006b58" } },
    })
    const candleSeries = nextChart.addSeries(CandlestickSeries, {
      upColor: "#00d4aa",
      downColor: "#ff4757",
      borderVisible: false,
      wickUpColor: "#00a987",
      wickDownColor: "#d93a48",
    })
    nextChart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#273633",
    }).priceScale().applyOptions({ scaleMargins: { top: 0.86, bottom: 0 } })
    chart.current = nextChart
    series.current = candleSeries
    return () => {
      nextChart.remove()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    if (!candles.length || !series.current || !chart.current) return
    series.current.setData(candles.map((candle) => ({ ...candle, time: candle.time as UTCTimestamp })))
    chart.current.timeScale().fitContent()
  }, [candles])

  const levels = useMemo(() => plan && candles.length ? [
    { key: "target2", label: "T2 · TAKE MORE PROFIT", value: plan.target2, color: "#a6ff4d" },
    { key: "target1", label: "T1 · TAKE SOME PROFIT", value: plan.target1, color: "#00d4aa" },
    { key: "entry", label: "ENTRY · BUY HERE", value: plan.entry, color: "#00d4aa" },
    { key: "stop", label: "STOP · GET OUT IF WRONG", value: plan.stop, color: "#ff4757" },
  ].map((level) => ({ ...level, top: levelPosition(level.value, candles) })) : [], [candles, plan])

  return (
    <div className="hud-corners scanline relative h-full min-h-[470px] overflow-hidden bg-[#0d0f0f]">
      <div ref={container} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center gap-4 border-b border-[#2a2a2a] bg-[#0d0d0de6] px-3">
        <span className="micro !text-white">{quote?.symbol ?? "—"} · 5 MIN</span>
        <span className="mono text-xs text-white">{quote ? number(quote.price) : "CONNECTING"}</span>
        <span className="micro !text-[#00d4aa]">Chart world</span>
        <span className="ml-auto micro">{modules.esp ? "ESP LEVELS · ON" : "ESP LEVELS · OFF"}</span>
      </div>

      {plan && modules.esp ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          <svg className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
            <line x1="68%" y1={`${levelPosition(quote?.price ?? plan.entry, candles)}%`} x2="91%" y2={`${levelPosition(plan.target1, candles)}%`} stroke="#00d4aa" strokeWidth="1" strokeDasharray="5 5" opacity=".6" />
          </svg>
          <div
            className="absolute left-[23%] right-[9%] border border-[#00d4aa] bg-[#00d4aa0d]"
            style={{
              top: `${levelPosition(plan.entry + Math.abs(plan.entry - plan.stop) * 0.14, candles)}%`,
              height: `${Math.max(14, Math.abs(plan.entry - plan.stop) * 12)}px`,
            }}
          >
            <span className="absolute -left-px -top-6 border border-[#00d4aa] bg-[#08221d] px-2 py-1 font-mono text-[10px] font-bold text-[#00d4aa]">ESP BOX · ENTRY ZONE</span>
          </div>
          {levels.map((level) => (
            <div key={level.key} className="absolute left-[15%] right-[3%] border-t" style={{ top: `${level.top}%`, borderColor: level.color }}>
              <div className="absolute -right-px -top-[14px] flex h-7 items-center gap-3 border px-2 font-mono text-[10px] font-bold" style={{ color: level.color, borderColor: level.color, background: "#0d0f0f" }}>
                <span>{level.label}</span>
                <span>{number(level.value)}</span>
              </div>
              <span className="absolute left-0 top-1 font-mono text-[9px]" style={{ color: level.color }}>WAYPOINT // {level.key.toUpperCase()}</span>
            </div>
          ))}
          <div className="absolute left-[4%] top-[14%] border-l-2 border-[#ffb800] bg-[#17150d] px-3 py-2">
            <span className="micro block !text-[#ffb800]">Lock target</span>
            <span className="mono mt-1 block text-lg text-white">{number(plan.target1)}</span>
            <span className="text-[10px] text-[#aaa]">{plan.rewardRisk.toFixed(1)}R reward / risk</span>
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 border border-[#444] bg-[#111]/90 px-4 py-3 text-center">
          <span className="micro block">No waypoints yet</span>
          <span className="mt-1 block text-xs text-[#bbb]">Ask Jarvis: “What’s a plan for today?”</span>
        </div>
      )}
    </div>
  )
}
