import type { Candle } from "@/lib/market"

export type AlgoName = "TrendFollow" | "MeanRevert" | "Breakout"
export type PlanQuality = "Strong" | "Okay" | "Skip"

export type Signal = {
  id: string
  symbol: string
  algo: AlgoName
  side: "BUY" | "SELL"
  entry: number
  stop: number
  target1: number
  target2: number
  confidence: number
  rewardRisk: number
  quality: PlanQuality
  plainEnglish: string
  reason: string
  invalidation: string
  congestion: "low" | "medium" | "high"
}

const round = (value: number) => Math.round(value * 100) / 100
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

export function scorePlan(rewardRisk: number, stopDistancePercent: number, congestion: Signal["congestion"]): PlanQuality {
  if (rewardRisk < 2 || congestion === "high" || stopDistancePercent > 3) return "Skip"
  if (rewardRisk >= 2.5 && congestion === "low" && stopDistancePercent <= 2) return "Strong"
  return "Okay"
}

function signal(symbol: string, algo: AlgoName, entry: number, stop: number, confidence: number, congestion: Signal["congestion"], reason: string): Signal {
  const risk = Math.abs(entry - stop)
  const target1 = entry + risk * 2
  const target2 = entry + risk * 3
  const rewardRisk = round((target1 - entry) / risk)
  const quality = scorePlan(rewardRisk, (risk / entry) * 100, congestion)
  return {
    id: `${symbol}-${algo}`,
    symbol,
    algo,
    side: "BUY",
    entry: round(entry),
    stop: round(stop),
    target1: round(target1),
    target2: round(target2),
    confidence,
    rewardRisk,
    quality,
    plainEnglish:
      quality === "Skip"
        ? "Skip this setup — price is crowded or the reward is too small."
        : `Buy near ${round(entry)} only if price holds. Get out at ${round(stop)} if wrong.`,
    reason,
    invalidation: `Out if a 5-minute candle closes below ${round(stop)}.`,
    congestion,
  }
}

export function trendFollow(symbol: string, candles: Candle[]): Signal[] {
  if (candles.length < 30) return []
  const closes = candles.map((candle) => candle.close)
  const fast = average(closes.slice(-10))
  const slow = average(closes.slice(-30))
  const last = closes.at(-1)!
  const low = Math.min(...candles.slice(-8).map((candle) => candle.low))
  return [signal(symbol, "TrendFollow", last, Math.min(low, last * 0.992), fast > slow ? 82 : 58, fast > slow ? "low" : "medium", "The short trend is above the longer trend, so buyers have control.")]
}

export function meanRevert(symbol: string, candles: Candle[]): Signal[] {
  if (candles.length < 20) return []
  const closes = candles.map((candle) => candle.close)
  const mean = average(closes.slice(-20))
  const last = closes.at(-1)!
  const entry = Math.min(last, mean * 0.995)
  return [signal(symbol, "MeanRevert", entry, entry * 0.989, last < mean ? 76 : 55, Math.abs(last - mean) / mean < 0.004 ? "high" : "medium", "Price moved away from its recent average and may snap back.")]
}

export function breakout(symbol: string, candles: Candle[]): Signal[] {
  if (candles.length < 25) return []
  const recent = candles.slice(-21, -1)
  const resistance = Math.max(...recent.map((candle) => candle.high))
  const support = Math.min(...recent.slice(-8).map((candle) => candle.low))
  const last = candles.at(-1)!.close
  return [signal(symbol, "Breakout", Math.max(last, resistance * 1.001), Math.max(support, resistance * 0.992), last >= resistance ? 86 : 68, last >= resistance ? "low" : "medium", "Price is testing the recent high with room above it.")]
}

export const ALGO_RUNNERS: Record<AlgoName, (symbol: string, candles: Candle[]) => Signal[]> = {
  TrendFollow: trendFollow,
  MeanRevert: meanRevert,
  Breakout: breakout,
}
